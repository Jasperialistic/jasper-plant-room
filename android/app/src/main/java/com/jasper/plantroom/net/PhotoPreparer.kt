package com.jasper.plantroom.net

import android.content.Context
import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

/**
 * On-device photo preparation mirroring the web's v5.0.0 single-pass media
 * pipeline: decode once (EXIF orientation honored), encode twice (bounded
 * original + 640px thumbnail). Bitmaps are recycled deterministically.
 */
object PhotoPreparer {
    const val MAX_EDGE = 2200
    const val JPEG_QUALITY = 84
    const val THUMB_EDGE = 640
    const val THUMB_QUALITY = 72

    suspend fun prepare(context: Context, uri: Uri, displayName: String): PreparedPhoto =
        withContext(Dispatchers.Default) {
            val source = ImageDecoder.createSource(context.contentResolver, uri)
            val decoded = ImageDecoder.decodeBitmap(source) { image, info, _ ->
                // One decode; EXIF orientation is applied by ImageDecoder.
                image.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                val scale = minOf(1f, MAX_EDGE.toFloat() / maxOf(info.size.width, info.size.height))
                if (scale < 1f) {
                    image.setTargetSize(
                        (info.size.width * scale).toInt().coerceAtLeast(1),
                        (info.size.height * scale).toInt().coerceAtLeast(1),
                    )
                }
            }
            try {
                val originalBytes = compress(decoded, JPEG_QUALITY)
                val thumb = scaled(decoded, THUMB_EDGE)
                try {
                    PreparedPhoto(originalBytes, compress(thumb, THUMB_QUALITY))
                } finally {
                    thumb.recycle()
                }
            } finally {
                decoded.recycle()
            }
        }

    private fun scaled(bitmap: Bitmap, maxEdge: Int): Bitmap {
        val scale = minOf(1f, maxEdge.toFloat() / maxOf(bitmap.width, bitmap.height))
        if (scale >= 1f) return bitmap.copy(Bitmap.Config.ARGB_8888, false)
        return Bitmap.createScaledBitmap(
            bitmap,
            (bitmap.width * scale).toInt().coerceAtLeast(1),
            (bitmap.height * scale).toInt().coerceAtLeast(1),
            true,
        )
    }

    private fun compress(bitmap: Bitmap, quality: Int): ByteArray =
        ByteArrayOutputStream().use { out ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
            out.toByteArray()
        }
}
