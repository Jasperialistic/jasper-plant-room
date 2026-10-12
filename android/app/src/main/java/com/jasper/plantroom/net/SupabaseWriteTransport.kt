package com.jasper.plantroom.net

import com.jasper.plantroom.BuildConfig
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.ktor.http.ContentType
import io.github.jan.supabase.storage.storage
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
private data class ExistingRow(val id: String)

/**
 * Real write transport against the existing Supabase authority. Every call
 * requires an authenticated owner session (RLS enforces the same boundary);
 * anonymous use fails loudly rather than writing anything.
 */
class SupabaseWriteTransport : UploadTransport {

    private fun requireOwner(): String {
        return PlantRepository.requireOwnerId()
    }

    private fun safeName(fileName: String): String =
        fileName.replace(Regex("[^A-Za-z0-9._-]"), "-").takeIf { it.isNotBlank() } ?: "photo.jpg"

    /** Create-only stable path, mirroring the web queue's contract. */
    override fun originalPath(plantId: String, fileName: String): String {
        PlantRules.requireCanonicalPlantId(plantId)
        return "${requireOwner()}/$plantId/growth/${UUID.randomUUID()}-${safeName(fileName)}"
    }

    private suspend fun createOnly(upload: suspend () -> Unit) {
        try { upload() } catch (error: Exception) {
            if (error is kotlinx.coroutines.CancellationException) throw error
            if (!Regex("already exists|duplicate|resource exists", RegexOption.IGNORE_CASE).containsMatchIn(error.message ?: "")) throw error
        }
    }

    override fun thumbnailPath(originalPath: String): String =
        originalPath.replace("/growth/", "/thumbs/")
            .replace(Regex("\\.[^/.]+$"), "") + ".thumb.jpg"

    override suspend fun findExisting(storagePath: String): String? =
        PlantRepository.client.postgrest["plant_photos"].select {
            filter { eq("storage_path", storagePath) }
            limit(1)
        }.decodeList<ExistingRow>().firstOrNull()?.id

    override suspend fun uploadOriginal(path: String, bytes: ByteArray, mimeType: String) {
        requireOwner()
        createOnly { PlantRepository.client.storage.from(BuildConfig.MEDIA_BUCKET)
            .upload(path, bytes) {
                contentType = ContentType.parse(mimeType)
                upsert = false
            }
        }
    }

    override suspend fun uploadThumbnail(path: String, bytes: ByteArray) {
        requireOwner()
        createOnly { PlantRepository.client.storage.from(BuildConfig.MEDIA_BUCKET)
            .upload(path, bytes) {
                contentType = ContentType.Image.JPEG
                upsert = false
            }
        }
    }

    override suspend fun insertMetadata(
        plantId: String,
        storagePath: String,
        thumbnailPath: String,
        photoDate: String,
        note: String,
    ): String {
        val row = MetadataInsert(
            id = UUID.nameUUIDFromBytes(storagePath.toByteArray(Charsets.UTF_8)).toString(),
            userId = requireOwner(),
            plantId = plantId,
            kind = "growth",
            storagePath = storagePath,
            thumbnailPath = thumbnailPath,
            photoDate = photoDate,
            note = note,
        )
        return try {
            PlantRepository.client.postgrest["plant_photos"].insert(row) {
                select(Columns.list("id"))
            }.decodeSingle<ExistingRow>().id
        } catch (error: Exception) {
            if (error is kotlinx.coroutines.CancellationException) throw error
            findExisting(storagePath) ?: throw error
        }
    }
}

@Serializable
private data class MetadataInsert(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("plant_id") val plantId: String,
    val kind: String,
    @SerialName("storage_path") val storagePath: String,
    @SerialName("thumbnail_path") val thumbnailPath: String,
    @SerialName("photo_date") val photoDate: String,
    val note: String,
    @SerialName("sort_order") val sortOrder: Int = 0,
)
