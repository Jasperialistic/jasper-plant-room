package com.jasper.plantroom.net

import com.jasper.plantroom.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.storage.storage
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Read models for the existing production schema (names and columns unchanged). */
@Serializable
data class Plant(
    val id: String,
    val name: String,
    @SerialName("plant_group") val group: String? = null,
    val location: String? = null,
    @SerialName("next_check") val nextCheck: String? = null,
)

@Serializable
data class PlantPhoto(
    val id: String,
    @SerialName("plant_id") val plantId: String,
    val kind: String? = null,
    @SerialName("storage_path") val storagePath: String? = null,
    @SerialName("thumbnail_path") val thumbnailPath: String? = null,
    @SerialName("photo_date") val photoDate: String? = null,
)

/**
 * Shared Plant Room authority: the same Supabase project, tables and RLS as the
 * web app. Only the public anon key is embedded (RLS enforces access); no
 * service-role or private credentials ever ship in the APK.
 */
object PlantRepository {

    val client: SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
    ) {
        install(Auth)
        install(Postgrest)
        install(Storage)
    }

    val isAuthenticated: Boolean
        get() = client.auth.currentSessionOrNull() != null

    suspend fun signIn(email: String, password: String) {
        client.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
    }

    suspend fun signOut() = client.auth.signOut()

    suspend fun loadPlants(): List<Plant> =
        client.postgrest["plants"].select().decodeList<Plant>()

    suspend fun loadPhotos(plantId: String): List<PlantPhoto> =
        client.postgrest["plant_photos"].select {
            filter { eq("plant_id", plantId) }
        }.decodeList<PlantPhoto>()

    /** Public CDN-served derivative URL (cache-friendly; originals are on-demand only). */
    fun photoUrl(storagePath: String): String =
        client.storage.from(BuildConfig.MEDIA_BUCKET).publicUrl(storagePath)
}
