package com.jasper.plantroom.net

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Job
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.withTimeout
import java.util.UUID

enum class UploadState { QUEUED, PREPARING, UPLOADING, CONFIRMING, COMPLETE, FAILED, CANCELLED }

data class UploadItem(
    val id: String,
    val displayName: String,
    val state: UploadState = UploadState.QUEUED,
    val attempts: Int = 0,
    val error: String? = null,
)

/**
 * Transport seam: the real implementation speaks to the existing Supabase
 * project (RLS-protected); tests use a fake. No production writes happen in
 * tests, and real end-to-end write testing stays owner-gated.
 */
interface UploadTransport {
    /** Deterministic create-only path, mirroring the web contract. */
    fun originalPath(plantId: String, fileName: String): String
    fun thumbnailPath(originalPath: String): String

    /** Idempotency probe: existing metadata id for a storage path, if any. */
    suspend fun findExisting(storagePath: String): String?

    suspend fun uploadOriginal(path: String, bytes: ByteArray, mimeType: String)
    suspend fun uploadThumbnail(path: String, bytes: ByteArray)

    suspend fun insertMetadata(
        plantId: String,
        storagePath: String,
        thumbnailPath: String,
        photoDate: String,
        note: String,
    ): String
}

/**
 * Bounded, recoverable growth-photo upload queue — the native counterpart of
 * the web's v4.42 queue and v5.0.0 single-pass media pipeline.
 *
 * - bounded concurrency (1 worker on low-memory devices, 2 otherwise)
 * - per-item states with partial-failure isolation
 * - retry with backoff for transient failures
 * - duplicate-safe: existing storage paths skip re-upload and metadata insert
 * - cancellation-safe: in-flight work stops at the next suspension point
 */
class GrowthUploadCoordinator(
    private val transport: UploadTransport,
    private val maxConcurrency: Int = 2,
    private val maxAttempts: Int = 3,
    private val retryDelaysMs: List<Long> = listOf(700L, 1600L),
    private val transient: (Throwable) -> Boolean = { error ->
        Regex("network|connection|timeout|timed out|temporar|\\b5[0-9]{2}\\b|\\b429\\b", RegexOption.IGNORE_CASE).containsMatchIn(error.message ?: "") || error is java.io.IOException
    },
) {
    private val _items = MutableStateFlow<List<UploadItem>>(emptyList())
    val items: StateFlow<List<UploadItem>> = _items

    fun enqueue(plantId: String, photoDate: String, note: String, files: List<PendingPhoto>) {
        java.time.LocalDate.parse(photoDate)
        cancelled = false
        _items.update { current ->
            current + files.filter { file -> current.none { it.id == file.id } }.map { file ->
                UploadItem(
                    id = file.id,
                    displayName = file.displayName,
                ).also { item -> pending[item.id] = PendingWork(plantId, photoDate, note, file) }
            }
        }
    }

    private class PendingWork(
        val plantId: String,
        val photoDate: String,
        val note: String,
        val photo: PendingPhoto,
    ) {
        var originalPath: String? = null
        var originalUploaded = false
        var thumbnailUploaded = false
    }

    private val pending = mutableMapOf<String, PendingWork>()

    private var cancelled = false
    private var activeRun: Job? = null
    private val runLock = Mutex()

    fun cancel() {
        cancelled = true
        activeRun?.cancel()
    }

    fun clearCompleted() {
        _items.update { current -> current.filter { it.state != UploadState.COMPLETE } }
    }

    private fun transition(id: String, mutate: (UploadItem) -> UploadItem) {
        _items.update { current -> current.map { if (it.id == id) mutate(it) else it } }
    }

    suspend fun run(resumeCancelled: Boolean = false) = coroutineScope {
        if (!runLock.tryLock()) return@coroutineScope
        activeRun = currentCoroutineContext()[Job]
        if (resumeCancelled) cancelled = false
        try {
            val queue = _items.value.filter { it.state == UploadState.QUEUED || it.state == UploadState.FAILED || (resumeCancelled && it.state == UploadState.CANCELLED) }
            val semaphore = Semaphore(maxConcurrency.coerceAtLeast(1))
            queue.map { item ->
                async {
                    semaphore.withPermit {
                        if (cancelled) transition(item.id) { it.copy(state = UploadState.CANCELLED) }
                        else uploadOne(item.id)
                    }
                }
            }.awaitAll()
        } finally {
            if (cancelled || !currentCoroutineContext()[Job]!!.isActive) {
                _items.update { current -> current.map { if (it.state !in listOf(UploadState.COMPLETE, UploadState.FAILED)) it.copy(state = UploadState.CANCELLED) else it } }
            }
            activeRun = null
            runLock.unlock()
        }
    }

    private suspend fun uploadOne(id: String) {
        val work = pending[id] ?: run {
            transition(id) { it.copy(state = UploadState.FAILED, error = "Missing source photo") }
            return
        }
        var lastError: Throwable? = null
        var prepared: PreparedPhoto? = null
        for (attempt in 1..maxAttempts) {
            if (cancelled) {
                transition(id) { it.copy(state = UploadState.CANCELLED) }
                return
            }
            transition(id) { it.copy(state = if (attempt == 1) UploadState.PREPARING else UploadState.UPLOADING, attempts = attempt, error = null) }
            try {
                withTimeout(60_000) {
                    val originalPath = work.originalPath ?: transport.originalPath(work.plantId, work.photo.displayName).also { work.originalPath = it }
                    // Probe before decoding: a lost metadata response does not reupload.
                    val existingId = transport.findExisting(originalPath)
                    if (existingId == null) {
                        if (!work.originalUploaded || !work.thumbnailUploaded) {
                            val bytes = prepared ?: withContext(Dispatchers.Default) { work.photo.prepare() }.also { prepared = it }
                            transition(id) { it.copy(state = UploadState.UPLOADING) }
                            if (!work.originalUploaded) {
                                transport.uploadOriginal(originalPath, bytes.originalBytes, "image/jpeg")
                                work.originalUploaded = true
                            }
                            if (!work.thumbnailUploaded) {
                                transport.uploadThumbnail(transport.thumbnailPath(originalPath), bytes.thumbnailBytes)
                                work.thumbnailUploaded = true
                            }
                        }
                        transition(id) { it.copy(state = UploadState.CONFIRMING) }
                        transport.insertMetadata(work.plantId, originalPath, transport.thumbnailPath(originalPath), work.photoDate, work.note)
                    }
                }

                transition(id) { it.copy(state = UploadState.COMPLETE) }
                pending.remove(id)
                return
            } catch (timeout: kotlinx.coroutines.TimeoutCancellationException) {
                lastError = java.io.IOException("Photo upload timed out. Retry safely.", timeout)
                if (attempt >= maxAttempts) break
                delay(retryDelaysMs.getOrElse(attempt - 1) { 1600L })
            } catch (cancellation: CancellationException) {
                transition(id) { it.copy(state = UploadState.CANCELLED) }
                throw cancellation
            } catch (error: Throwable) {
                lastError = error
                if (attempt >= maxAttempts || !transient(error)) break
                delay(retryDelaysMs.getOrElse(attempt - 1) { 1600L })
            }
        }
        transition(id) { it.copy(state = UploadState.FAILED, error = lastError?.message ?: "Upload failed") }
    }
}

/** Source photo prepared off the main thread; decoded once, encoded twice. */
data class PendingPhoto(
    val id: String,
    val displayName: String,
    val prepare: suspend () -> PreparedPhoto,
)

data class PreparedPhoto(
    val originalBytes: ByteArray,
    val thumbnailBytes: ByteArray,
) {
    override fun equals(other: Any?): Boolean = this === other
    override fun hashCode(): Int = System.identityHashCode(this)
}

fun newUploadId(): String = UUID.randomUUID().toString()
