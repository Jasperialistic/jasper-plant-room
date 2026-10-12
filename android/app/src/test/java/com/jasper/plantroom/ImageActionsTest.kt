package com.jasper.plantroom

import com.jasper.plantroom.net.ImageAction
import com.jasper.plantroom.net.ImageActionCoordinator
import com.jasper.plantroom.net.ImageActionResult
import com.jasper.plantroom.net.ImageActionSink
import com.jasper.plantroom.net.ImageBytesSource
import com.jasper.plantroom.net.imageDisplayNameOf
import com.jasper.plantroom.net.imageMimeOf
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException

private val photoBytes = byteArrayOf(0x12, 0x34, 0x56, 0x78, 0x00, 0x7F.toByte())

private class FakeImageSource : ImageBytesSource {
    var fetches = 0
    var lastUrl: String? = null
    var fail = false
    override suspend fun fetch(url: String): ByteArray {
        fetches++; lastUrl = url
        if (fail) throw IOException("connection reset")
        return photoBytes
    }
}

private class FakeSink : ImageActionSink {
    var copied: ByteArray? = null
    var saved: ByteArray? = null
    var shared: ByteArray? = null
    var fail = false
    override suspend fun copyImage(bytes: ByteArray, mime: String, displayName: String) {
        if (fail) throw IOException("clipboard unavailable"); copied = bytes
    }
    override suspend fun saveImage(bytes: ByteArray, mime: String, displayName: String): String {
        if (fail) throw IOException("mediastore unavailable"); saved = bytes
        return "Gallery › Pictures/PlantRoom"
    }
    override suspend fun shareImage(bytes: ByteArray, mime: String, displayName: String) {
        if (fail) throw IOException("chooser unavailable"); shared = bytes
    }
}

class ImageActionsTest {
    @Test fun `copy delivers the original bytes unchanged`() = runBlocking {
        val sink = FakeSink()
        val result = ImageActionCoordinator(FakeImageSource(), sink).perform(ImageAction.COPY, "https://x.test/moss.jpg")
        assertTrue(result is ImageActionResult.Copied)
        assertArrayEquals(photoBytes, sink.copied) // byte-identical: resolution + EXIF orientation preserved
    }

    @Test fun `save delivers the original bytes and reports the location`() = runBlocking {
        val sink = FakeSink()
        val result = ImageActionCoordinator(FakeImageSource(), sink).perform(ImageAction.SAVE, "https://x.test/moss.jpg")
        assertEquals("Gallery › Pictures/PlantRoom", (result as ImageActionResult.Saved).location)
        assertArrayEquals(photoBytes, sink.saved)
    }

    @Test fun `share delivers the original bytes`() = runBlocking {
        val sink = FakeSink()
        val result = ImageActionCoordinator(FakeImageSource(), sink).perform(ImageAction.SHARE, "https://x.test/moss.jpg")
        assertTrue(result is ImageActionResult.Shared)
        assertArrayEquals(photoBytes, sink.shared)
    }

    @Test fun `network failure is reported and never reaches the sink`() = runBlocking {
        val source = FakeImageSource().apply { fail = true }
        val sink = FakeSink()
        val result = ImageActionCoordinator(source, sink).perform(ImageAction.COPY, "https://x.test/moss.jpg")
        assertTrue((result as ImageActionResult.Failed).message.contains("Download failed"))
        assertNull(sink.copied)
    }

    @Test fun `blank or invalid url fails before any fetch`() = runBlocking {
        val source = FakeImageSource()
        val sink = FakeSink()
        val coordinator = ImageActionCoordinator(source, sink)
        listOf("", "   ", "ftp://x.test/moss.jpg", "not-a-url").forEach { bad ->
            assertTrue(coordinator.perform(ImageAction.SAVE, bad) is ImageActionResult.Failed)
        }
        assertEquals(0, source.fetches)
        assertNull(sink.saved)
    }

    @Test fun `sink failure is reported gracefully`() = runBlocking {
        val sink = FakeSink().apply { fail = true }
        val result = ImageActionCoordinator(FakeImageSource(), sink).perform(ImageAction.SAVE, "https://x.test/moss.jpg")
        assertTrue((result as ImageActionResult.Failed).message.contains("Could not save"))
    }

    @Test fun `cancelling a download cancels the action without touching the sink`() = runBlocking {
        val started = CompletableDeferred<Unit>()
        val source = object : ImageBytesSource {
            override suspend fun fetch(url: String): ByteArray {
                started.complete(Unit)
                return suspendCancellableCoroutine { }
            }
        }
        val sink = FakeSink()
        val job = launch {
            ImageActionCoordinator(source, sink).perform(ImageAction.COPY, "https://x.test/moss.jpg")
        }
        started.await()
        job.cancelAndJoin()
        assertTrue(job.isCancelled)
        assertNull(sink.copied)
    }

    @Test fun `mime and display name follow the url and ignore query tokens`() {
        assertEquals("image/png", imageMimeOf("https://cdn.test/photo.png?token=abc"))
        assertEquals("photo.png", imageDisplayNameOf("https://cdn.test/photo.png?token=abc"))
        assertEquals("image/webp", imageMimeOf("https://cdn.test/photo.webp"))
        assertEquals("image/jpeg", imageMimeOf("https://cdn.test/photo"))
        assertEquals("plant-photo.jpg", imageDisplayNameOf("https://cdn.test/photo"))
    }
}
