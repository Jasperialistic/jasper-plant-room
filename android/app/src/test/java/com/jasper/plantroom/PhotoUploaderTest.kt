package com.jasper.plantroom

import com.jasper.plantroom.net.GrowthUploadCoordinator
import com.jasper.plantroom.net.PendingPhoto
import com.jasper.plantroom.net.PreparedPhoto
import com.jasper.plantroom.net.UploadState
import com.jasper.plantroom.net.UploadTransport
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.launch
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException
import java.util.concurrent.atomic.AtomicInteger

private class FakeTransport(
    private val existingPaths: Set<String> = emptySet(),
    private val failOriginalTimes: Int = 0,
) : UploadTransport {
    val originals = mutableListOf<String>()
    val thumbnails = mutableListOf<String>()
    val metadata = mutableListOf<String>()
    val failures = AtomicInteger(0)
    private val remainingFailures = AtomicInteger(failOriginalTimes)
    var inFlight = AtomicInteger(0)
    var maxInFlight = AtomicInteger(0)

    override fun originalPath(plantId: String, fileName: String) = "$plantId/growth/$fileName"
    override fun thumbnailPath(originalPath: String) = originalPath.replace("/growth/", "/thumbs/") + ".thumb.jpg"

    override suspend fun findExisting(storagePath: String): String? =
        if (storagePath in existingPaths) "existing-id" else null

    override suspend fun uploadOriginal(path: String, bytes: ByteArray, mimeType: String) {
        val now = inFlight.incrementAndGet()
        maxInFlight.updateMax(now)
        try {
            delay(20)
            if (remainingFailures.getAndDecrement() > 0) {
                failures.incrementAndGet()
                throw IOException("transient network error")
            }
            originals += path
        } finally {
            inFlight.decrementAndGet()
        }
    }

    override suspend fun uploadThumbnail(path: String, bytes: ByteArray) {
        thumbnails += path
    }

    override suspend fun insertMetadata(
        plantId: String,
        storagePath: String,
        thumbnailPath: String,
        photoDate: String,
        note: String,
    ): String {
        metadata += storagePath
        return "meta-${metadata.size}"
    }

    private fun AtomicInteger.updateMax(candidate: Int) {
        while (true) {
            val current = get()
            if (candidate <= current || compareAndSet(current, candidate)) return
        }
    }
}

private fun photo(id: String) = PendingPhoto(id, "$id.jpg") {
    PreparedPhoto(ByteArray(10), ByteArray(4))
}

private fun coordinator(transport: FakeTransport, concurrency: Int = 2, transient: (Throwable) -> Boolean = { it is IOException }) =
    GrowthUploadCoordinator(transport, maxConcurrency = concurrency, transient = transient)

class PhotoUploaderTest {

    @Test
    fun `metadata failure retries the same random path without reupload or redecode`() = runBlocking {
        val base = FakeTransport()
        var pathCalls = 0;var metadataCalls = 0;var decodeCalls = 0
        val transport = object : UploadTransport by base {
            override fun originalPath(plantId: String, fileName: String) = "$plantId/growth/${++pathCalls}-$fileName"
            override suspend fun insertMetadata(plantId: String, storagePath: String, thumbnailPath: String, photoDate: String, note: String): String {
                if (++metadataCalls == 1) throw IOException("network failure")
                return base.insertMetadata(plantId,storagePath,thumbnailPath,photoDate,note)
            }
        }
        val c = GrowthUploadCoordinator(transport,retryDelaysMs=listOf(0,0))
        val file = PendingPhoto("a","a.jpg") { decodeCalls++;PreparedPhoto(ByteArray(10),ByteArray(4)) }
        c.enqueue("plant-1","2026-10-12","",listOf(file));c.run()
        assertEquals(1,pathCalls);assertEquals(1,decodeCalls)
        assertEquals(1,base.originals.size);assertEquals(1,base.thumbnails.size);assertEquals(1,base.metadata.size)
        assertEquals(UploadState.COMPLETE,c.items.value.single().state)
        c.enqueue("plant-1","2026-10-12","",listOf(file));c.run()
        assertEquals(1,c.items.value.size);assertEquals(1,base.metadata.size)
    }

    @Test
    fun `active cancellation restores queue and resume completes without losing items`() = runBlocking {
        val t = FakeTransport();val c = coordinator(t,concurrency=1)
        c.enqueue("plant-1","2026-10-12","",listOf(photo("a"),photo("b")))
        val job=launch { c.run() };delay(5);c.cancel();job.join()
        assertTrue(c.items.value.all { it.state == UploadState.CANCELLED })
        c.run(resumeCancelled=true)
        assertTrue(c.items.value.all { it.state == UploadState.COMPLETE })
        assertEquals(2,t.metadata.size)
    }

    @Test
    fun `complete batch uploads originals thumbnails and metadata per photo`() = runBlocking {
        val transport = FakeTransport()
        val c = coordinator(transport)
        c.enqueue("plant-1", "2026-10-11", "note", listOf(photo("a"), photo("b")))
        c.run()
        assertEquals(2, transport.originals.size)
        assertEquals(2, transport.thumbnails.size)
        assertEquals(2, transport.metadata.size)
        assertTrue(c.items.value.all { it.state == UploadState.COMPLETE })
    }

    @Test
    fun `concurrency never exceeds the bound`() = runBlocking {
        val transport = FakeTransport()
        val c = coordinator(transport, concurrency = 1)
        c.enqueue("plant-1", "2026-10-11", "", listOf(photo("a"), photo("b"), photo("c")))
        c.run()
        assertEquals(1, transport.maxInFlight.get())
    }

    @Test
    fun `one failed photo does not corrupt the batch`() = runBlocking {
        val transport = FakeTransport(failOriginalTimes = 1) // only the first upload call fails
        val c = coordinator(transport, concurrency = 1, transient = { false }) // serial + no retries
        c.enqueue("plant-1", "2026-10-11", "", listOf(photo("bad"), photo("good")))
        c.run()
        val states = c.items.value.associate { it.id to it.state }
        assertEquals(UploadState.FAILED, states["bad"])
        assertEquals(UploadState.COMPLETE, states["good"])
        assertEquals(1, transport.metadata.size)
    }

    @Test
    fun `transient failures are retried then succeed`() = runBlocking {
        val transport = FakeTransport(failOriginalTimes = 2) // fails twice, third attempt succeeds
        val c = coordinator(transport)
        c.enqueue("plant-1", "2026-10-11", "", listOf(photo("a")))
        c.run()
        assertEquals(UploadState.COMPLETE, c.items.value.single().state)
        assertEquals(2, transport.failures.get())
        assertEquals(1, transport.originals.size)
    }

    @Test
    fun `existing storage paths short-circuit without duplicate writes`() = runBlocking {
        val transport = FakeTransport(existingPaths = setOf("plant-1/growth/dup.jpg"))
        val c = coordinator(transport)
        c.enqueue("plant-1", "2026-10-11", "", listOf(PendingPhoto("x", "dup.jpg") { PreparedPhoto(ByteArray(1), ByteArray(1)) }))
        c.run()
        assertEquals(UploadState.COMPLETE, c.items.value.single().state)
        assertTrue(transport.originals.isEmpty())
        assertTrue(transport.metadata.isEmpty())
    }

    @Test
    fun `cancel stops queued items cleanly`() = runBlocking {
        val transport = FakeTransport()
        val c = coordinator(transport, concurrency = 1)
        c.enqueue("plant-1", "2026-10-11", "", listOf(photo("a"), photo("b"), photo("c")))
        c.cancel()
        c.run()
        assertTrue(c.items.value.all { it.state == UploadState.CANCELLED })
        assertTrue(transport.originals.isEmpty())
    }
}
