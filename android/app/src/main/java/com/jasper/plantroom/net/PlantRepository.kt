package com.jasper.plantroom.net

import com.jasper.plantroom.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.storage.storage
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Read models for the existing production schema. Column names mirror the web
 * app's contracts exactly (see index.html create/edit flows); no parallel data
 * model is introduced.
 */
@Serializable
data class Plant(
    val id: String,
    val name: String,
    @SerialName("plant_group") val group: String? = null,
    val location: String? = null,
    val light: String? = null,
    val environment: String? = null,
    val pot: String? = null,
    @SerialName("pot_type") val potType: String? = null,
    @SerialName("outer_pot") val outerPot: String? = null,
    val medium: String? = null,
    @SerialName("watering_mode") val wateringMode: String? = null,
    @SerialName("last_care") val lastCare: String? = null,
    @SerialName("last_action") val lastAction: String? = null,
    @SerialName("next_check") val nextCheck: String? = null,
    @SerialName("check_days") val checkDays: Int? = null,
    @SerialName("check_rule") val checkRule: String? = null,
    val notes: String? = null,
    val confidence: String? = null,
)

@Serializable
data class PlantPhoto(
    val id: String,
    @SerialName("plant_id") val plantId: String,
    val kind: String? = null,
    @SerialName("storage_path") val storagePath: String? = null,
    @SerialName("thumbnail_path") val thumbnailPath: String? = null,
    @SerialName("photo_date") val photoDate: String? = null,
    val note: String? = null,
    @SerialName("sort_order") val sortOrder: Int? = null,
    @SerialName("is_thumbnail") val isThumbnail: Boolean? = null,
)

@Serializable
data class PlantBasePhoto(
    val id: String,
    @SerialName("plant_id") val plantId: String,
    @SerialName("asset_path") val assetPath: String? = null,
    @SerialName("sort_order") val sortOrder: Int? = null,
    @SerialName("is_thumbnail") val isThumbnail: Boolean? = null,
    @SerialName("photo_date") val photoDate: String? = null,
    val hidden: Boolean? = null,
    val purged: Boolean? = null,
)

/**
 * Shared Plant Room authority: the same Supabase project, tables and RLS as the
 * web app. Only the public anon key is embedded (RLS enforces access); no
 * service-role or private credentials ever ship in the APK.
 */
object PlantRepository {

    private const val WEB_ASSET_BASE = "https://jasperialistic.github.io/jasper-plant-room/"

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

    /** Gallery and growth rows for one plant; ordering mirrors the web comparator. */
    suspend fun loadPhotos(plantId: String): List<PlantPhoto> =
        client.postgrest["plant_photos"].select {
            filter { eq("plant_id", plantId) }
            order("sort_order", Order.ASCENDING)
        }.decodeList<PlantPhoto>()

    /** One wholesale read for collection covers (mirrors the web's single query). */
    suspend fun loadAllPhotos(): List<PlantPhoto> =
        client.postgrest["plant_photos"].select().decodeList<PlantPhoto>()

    /** Bundled heritage photos (web assets) with their metadata rows. */
    suspend fun loadAllBasePhotos(): List<PlantBasePhoto> =
        client.postgrest["plant_base_photos"].select().decodeList<PlantBasePhoto>()

    /** Bundled assets resolve through the public Pages host (read-only GETs). */
    fun webAssetUrl(assetPath: String): String = WEB_ASSET_BASE + assetPath

    fun growthTimeline(photos: List<PlantPhoto>): List<PlantPhoto> =
        photos.filter { it.kind == "growth" }
            .sortedWith(compareBy(nullsLast()) { it.photoDate ?: "" })

    fun galleryPhotos(photos: List<PlantPhoto>): List<PlantPhoto> =
        photos.filter { it.kind == "gallery" }
            .sortedWith(compareBy({ it.sortOrder ?: 0 }, { it.photoDate ?: "" }))

    /** Thumbnail-first display URL; full originals stay on-demand only. */
    fun displayUrl(photo: PlantPhoto): String? {
        val path = photo.thumbnailPath?.takeIf { it.isNotBlank() }
            ?: photo.storagePath?.takeIf { it.isNotBlank() }
            ?: return null
        return client.storage.from(BuildConfig.MEDIA_BUCKET).publicUrl(path)
    }

    fun originalUrl(photo: PlantPhoto): String? =
        photo.storagePath?.takeIf { it.isNotBlank() }?.let {
            client.storage.from(BuildConfig.MEDIA_BUCKET).publicUrl(it)
        }

    /** Cover selection mirrors web: flagged thumbnail, else first gallery row,
     *  falling back to bundled base photos when a plant has no cloud gallery. */
    fun coverUrl(photos: List<PlantPhoto>, basePhotos: List<PlantBasePhoto> = emptyList()): String? {
        val gallery = galleryPhotos(photos)
        val chosen = gallery.firstOrNull { it.isThumbnail == true } ?: gallery.firstOrNull()
        if (chosen != null) return displayUrl(chosen)
        val base = basePhotos.filter { it.hidden != true && it.purged != true }
            .sortedWith(compareBy({ it.sortOrder ?: 0 }, { it.assetPath ?: "" }))
        val baseChosen = base.firstOrNull { it.isThumbnail == true } ?: base.firstOrNull()
        return baseChosen?.assetPath?.let { webAssetUrl(it) }
    }
}
