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
        val user = PlantRepository.client.auth.currentUserOrNull()
            ?: error("Owner sign-in is required to upload photos.")
        return user.id
    }

    private fun safeName(fileName: String): String =
        fileName.replace(Regex("[^A-Za-z0-9._-]"), "-").takeIf { it.isNotBlank() } ?: "photo.jpg"

    /** Create-only stable path, mirroring the web queue's contract. */
    override fun originalPath(plantId: String, fileName: String): String =
        "${requireOwner()}/$plantId/growth/${UUID.randomUUID()}-${safeName(fileName)}"

    override fun thumbnailPath(originalPath: String): String =
        originalPath.replace("/growth/", "/thumbs/")
            .replace(Regex("\\.[^/.]+$"), "") + ".thumb.jpg"

    override suspend fun findExisting(storagePath: String): String? =
        PlantRepository.client.postgrest["plant_photos"].select {
            filter { eq("storage_path", storagePath) }
            limit(1)
        }.decodeList<ExistingRow>().firstOrNull()?.id

    override suspend fun uploadOriginal(path: String, bytes: ByteArray, mimeType: String) {
        PlantRepository.client.storage.from(BuildConfig.MEDIA_BUCKET)
            .upload(path, bytes) {
                contentType = ContentType.parse(mimeType)
                upsert = false
            }
    }

    override suspend fun uploadThumbnail(path: String, bytes: ByteArray) {
        PlantRepository.client.storage.from(BuildConfig.MEDIA_BUCKET)
            .upload(path, bytes) {
                contentType = ContentType.Image.JPEG
                upsert = false
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
            userId = requireOwner(),
            plantId = plantId,
            kind = "growth",
            storagePath = storagePath,
            thumbnailPath = thumbnailPath,
            photoDate = photoDate,
            note = note,
        )
        val inserted = PlantRepository.client.postgrest["plant_photos"].insert(row) {
            select(Columns.list("id"))
        }.decodeSingle<ExistingRow>()
        return inserted.id
    }
}

@Serializable
private data class MetadataInsert(
    @SerialName("user_id") val userId: String,
    @SerialName("plant_id") val plantId: String,
    val kind: String,
    @SerialName("storage_path") val storagePath: String,
    @SerialName("thumbnail_path") val thumbnailPath: String,
    @SerialName("photo_date") val photoDate: String,
    val note: String,
    @SerialName("sort_order") val sortOrder: Int = 0,
)
