package com.jasper.plantroom.net

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/**
 * Full-resolution image byte source. Fetches only when the user actually asks
 * for Copy / Save / Share — never when the photo viewer merely opens.
 */
interface ImageBytesSource {
    /** @throws IOException on network or HTTP failure */
    suspend fun fetch(url: String): ByteArray
}

class HttpImageBytesSource : ImageBytesSource {
    override suspend fun fetch(url: String): ByteArray = withContext(Dispatchers.IO) {
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 15_000
            readTimeout = 30_000
            requestMethod = "GET"
            instanceFollowRedirects = true
        }
        try {
            val code = conn.responseCode
            if (code !in 200..299) throw IOException("HTTP $code")
            val input = conn.inputStream
            val out = ByteArrayOutputStream()
            val buf = ByteArray(64 * 1024)
            while (true) {
                val n = input.read(buf)
                if (n < 0) break
                out.write(buf, 0, n)
            }
            out.toByteArray()
        } finally {
            conn.disconnect()
        }
    }
}

/** Long-press actions offered on an enlarged photo. */
enum class ImageAction { COPY, SAVE, SHARE }

/** Platform sinks (clipboard, MediaStore, share sheet). Bytes arrive untouched. */
interface ImageActionSink {
    suspend fun copyImage(bytes: ByteArray, mime: String, displayName: String)
    /** @return human-readable save location */
    suspend fun saveImage(bytes: ByteArray, mime: String, displayName: String): String
    suspend fun shareImage(bytes: ByteArray, mime: String, displayName: String)
}

sealed interface ImageActionResult {
    data object Copied : ImageActionResult
    data class Saved(val location: String) : ImageActionResult
    data object Shared : ImageActionResult
    data class Failed(val message: String) : ImageActionResult
}

/**
 * One-shot coordinator for photo actions: validate, download once at full
 * resolution, hand the original bytes to the platform sink. Original Supabase
 * photographs are only ever read. Failures become [ImageActionResult.Failed]
 * messages instead of crashes; cancellation always propagates.
 */
class ImageActionCoordinator(
    private val source: ImageBytesSource,
    private val sink: ImageActionSink,
) {
    suspend fun perform(action: ImageAction, url: String): ImageActionResult {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return ImageActionResult.Failed("Invalid photo link.")
        }
        val mime = imageMimeOf(url)
        val name = imageDisplayNameOf(url)
        val bytes = try {
            source.fetch(url)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            return ImageActionResult.Failed("Download failed — check the connection and try again.")
        }
        return try {
            when (action) {
                ImageAction.COPY -> {
                    sink.copyImage(bytes, mime, name)
                    ImageActionResult.Copied
                }
                ImageAction.SAVE -> ImageActionResult.Saved(sink.saveImage(bytes, mime, name))
                ImageAction.SHARE -> {
                    sink.shareImage(bytes, mime, name)
                    ImageActionResult.Shared
                }
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            ImageActionResult.Failed("Could not ${labelOf(action)} this photo.")
        }
    }
}

private fun labelOf(action: ImageAction) = when (action) {
    ImageAction.COPY -> "copy"
    ImageAction.SAVE -> "save"
    ImageAction.SHARE -> "share"
}

/** Photo bytes are written untouched, so EXIF orientation survives natively. */
fun imageMimeOf(url: String): String {
    val path = url.substringBefore('?').substringBefore('#').lowercase()
    return when {
        path.endsWith(".png") -> "image/png"
        path.endsWith(".webp") -> "image/webp"
        path.endsWith(".gif") -> "image/gif"
        path.endsWith(".heic") || path.endsWith(".heif") -> "image/heic"
        else -> "image/jpeg"
    }
}

fun imageDisplayNameOf(url: String): String {
    val segment = url.substringBefore('?').substringBefore('#').substringAfterLast('/')
    val stem = segment.substringBeforeLast('.', "")
        .filter { it.isLetterOrDigit() || it == '_' || it == '-' }
        .take(40)
        .takeIf { it.length >= 2 } ?: "plant-photo"
    return "$stem.${extForMime(imageMimeOf(url))}"
}

private fun extForMime(mime: String) = when (mime) {
    "image/png" -> "png"
    "image/webp" -> "webp"
    "image/gif" -> "gif"
    "image/heic" -> "heic"
    else -> "jpg"
}
