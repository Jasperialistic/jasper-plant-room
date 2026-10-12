package com.jasper.plantroom.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.jasper.plantroom.net.ImageActionSink
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException

/**
 * Native image actions: clipboard copy, MediaStore save, system share sheet.
 * Original bytes are written untouched, so full resolution and EXIF
 * orientation survive. No storage permission is used: API 29+ saves are the
 * app's own MediaStore contribution (Gallery › Pictures/PlantRoom) and API 28
 * keeps the file in app storage instead of asking for broad access.
 */
class AndroidImageActionSink(
    private val context: Context,
    private val fileProviderAuthority: String,
) : ImageActionSink {

    override suspend fun copyImage(bytes: ByteArray, mime: String, displayName: String) =
        withContext(Dispatchers.IO) {
            val uri = cacheUri(bytes, displayName)
            val clip = ClipData.newUri(context.contentResolver, "image", uri)
            clipboard().setPrimaryClip(clip)
        }

    override suspend fun saveImage(bytes: ByteArray, mime: String, displayName: String): String =
        withContext(Dispatchers.IO) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) saveToMediaStore(bytes, mime, displayName)
            else saveToAppFiles(bytes, displayName)
        }

    override suspend fun shareImage(bytes: ByteArray, mime: String, displayName: String) =
        withContext(Dispatchers.IO) {
            val uri = cacheUri(bytes, displayName)
            val send = Intent(Intent.ACTION_SEND).apply {
                type = mime
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            val chooser = Intent.createChooser(send, "Share image").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooser)
        }

    private fun clipboard(): ClipboardManager =
        context.getSystemService(ClipboardManager::class.java)
            ?: throw IOException("Clipboard unavailable")

    private fun cacheUri(bytes: ByteArray, displayName: String): android.net.Uri {
        val dir = File(context.cacheDir, "images")
        if (!dir.exists()) dir.mkdirs()
        val file = uniqueFile(dir, displayName)
        file.writeBytes(bytes)
        return FileProvider.getUriForFile(context, fileProviderAuthority, file)
    }

    private fun saveToMediaStore(bytes: ByteArray, mime: String, displayName: String): String {
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, displayName)
            put(MediaStore.Images.Media.MIME_TYPE, mime)
            put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/PlantRoom")
            put(MediaStore.Images.Media.IS_PENDING, 1)
        }
        val resolver = context.contentResolver
        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
            ?: throw IOException("MediaStore refused the image")
        try {
            resolver.openOutputStream(uri)?.use { it.write(bytes) }
                ?: throw IOException("Could not write the saved image")
            values.clear()
            values.put(MediaStore.Images.Media.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
        } catch (e: Exception) {
            resolver.delete(uri, null, null) // never leave a broken pending row
            throw e
        }
        return "Gallery › Pictures/PlantRoom"
    }

    private fun saveToAppFiles(bytes: ByteArray, displayName: String): String {
        val dir = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES) ?: context.filesDir
        uniqueFile(dir, displayName).writeBytes(bytes)
        return "Plant Room app folder (Android 9 — use Share to move it into Gallery)"
    }

    private fun uniqueFile(dir: File, displayName: String): File {
        var file = File(dir, displayName)
        var n = 1
        while (file.exists()) {
            file = File(dir, displayName.replace(Regex("(\\.[^.]+)$"), "-$n$1"))
            n++
        }
        return file
    }
}
