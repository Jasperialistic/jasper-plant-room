package com.jasper.plantroom.net

import com.jasper.plantroom.BuildConfig
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.LocalDate

@Serializable
data class CareLogInsert(
    @SerialName("user_id") val userId: String,
    @SerialName("plant_id") val plantId: String,
    @SerialName("care_date") val careDate: String,
    @SerialName("plant_name") val plantName: String,
    val action: String,
    val details: String,
    val location: String?,
)

@Serializable
data class PlantUpdate(
    val name: String,
    @SerialName("plant_group") val group: String?,
    val location: String?,
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

/** Pure rules shared with the web app — kept side-effect free for JVM tests. */
object PlantRules {

    private val uuidPattern = Regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")

    fun isCanonicalPlantId(value: String): Boolean = uuidPattern.matches(value)

    fun requireCanonicalPlantId(value: String): String {
        require(isCanonicalPlantId(value)) { "Plant identity is not a valid cloud UUID. Nothing was saved." }
        return value
    }

    fun deriveNextCheck(action: String, checkDays: Int?, today: String): String? = when {
        action == "Watered" && checkDays != null -> addDays(today, checkDays)
        action == "Checked — still moist" -> addDays(today, 1)
        else -> null
    }

    fun addDays(isoDate: String, days: Int): String =
        LocalDate.parse(isoDate).plusDays(days.toLong()).toString()

    fun slugify(name: String): String {
        val slug = name.lowercase()
            .replace(Regex("[^a-z0-9]+"), "-")
            .trim('-')
        return slug.ifBlank { "plant" }
    }

    /** Returns an error message, or null when the form is valid. */
    fun validate(name: String, checkDaysText: String, nextCheckText: String): String? = when {
        name.isBlank() -> "Plant name is required."
        checkDaysText.isNotBlank() && checkDaysText.toIntOrNull() == null -> "Check interval must be a whole number of days."
        nextCheckText.isNotBlank() && runCatching { LocalDate.parse(nextCheckText) }.isFailure -> "Next check must be a date like 2026-10-11."
        else -> null
    }
}

/**
 * Owner write operations against the existing contracts (plants, care_log).
 * Mirrors the web's addCare/createNewPlant field meanings exactly. Every call
 * requires an authenticated owner session; RLS enforces the same boundary.
 */
object PlantWriter {

    private fun requireOwner(): String =
        PlantRepository.client.auth.currentUserOrNull()?.id
            ?: error("Owner sign-in is required to make changes.")

    /** Web contract: care_log row + plants.last_care/last_action/next_check update. */
    suspend fun addCare(plant: Plant, action: String, details: String, nextCheck: String?) {
        val userId = requireOwner()
        PlantRules.requireCanonicalPlantId(plant.id)
        val today = java.time.LocalDate.now().toString()
        PlantRepository.client.postgrest["care_log"].insert(
            CareLogInsert(
                userId = userId,
                plantId = plant.id,
                careDate = today,
                plantName = plant.name,
                action = action,
                details = details,
                location = plant.location,
            ),
        )
        PlantRepository.client.postgrest["plants"].update(
            mapOf(
                "last_care" to today,
                "last_action" to action,
                "next_check" to nextCheck,
            ),
        ) {
            filter { eq("id", plant.id) }
        }
    }

    suspend fun updatePlant(plantId: String, update: PlantUpdate) {
        requireOwner()
        PlantRepository.client.postgrest["plants"].update(update) {
            filter { eq("id", plantId) }
        }
    }

    suspend fun createPlant(update: PlantUpdate, legacyId: String) {
        val userId = requireOwner()
        PlantRepository.client.postgrest["plants"].insert(
            update.copy().toInsertRow(userId, legacyId),
        )
    }

    private fun PlantUpdate.toInsertRow(userId: String, legacyId: String): Map<String, String?> = mapOf(
        "user_id" to userId,
        "legacy_id" to legacyId,
        "name" to name,
        "plant_group" to group,
        "location" to location,
        "light" to light,
        "environment" to environment,
        "pot" to pot,
        "pot_type" to potType,
        "outer_pot" to outerPot,
        "medium" to medium,
        "watering_mode" to wateringMode,
        "last_care" to lastCare,
        "last_action" to lastAction,
        "next_check" to nextCheck,
        "check_days" to (checkDays?.toString()),
        "check_rule" to checkRule,
        "notes" to notes,
        "confidence" to confidence,
    )
}
