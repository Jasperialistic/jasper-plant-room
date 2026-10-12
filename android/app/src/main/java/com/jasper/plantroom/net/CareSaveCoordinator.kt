package com.jasper.plantroom.net

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@Serializable
data class CareReceipt(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("plant_id") val plantId: String,
    @SerialName("care_date") val careDate: String,
    val action: String,
    val details: String? = null,
)

@Serializable
data class CareSchedule(
    val id: String,
    @SerialName("last_care") val lastCare: String?,
    @SerialName("last_action") val lastAction: String?,
    @SerialName("next_check") val nextCheck: String?,
)

interface CareTransport {
    suspend fun findLog(id: String, owner: String): CareReceipt?
    suspend fun insertLog(row: CareLogInsert)
    suspend fun updateSchedule(plantId: String, owner: String, date: String, action: String, next: String?): CareSchedule
}

interface CareAttemptJournal {
    fun get(key: String): String?
    fun put(key: String, id: String)
    fun remove(key: String)
}

class MemoryCareJournal : CareAttemptJournal {
    private val ids = ConcurrentHashMap<String, String>()
    override fun get(key: String) = ids[key]
    override fun put(key: String, id: String) { ids[key] = id }
    override fun remove(key: String) { ids.remove(key) }
}

/** Replays the existing two-write contract without inserting a second care row. */
class CareSaveCoordinator(
    private val transport: CareTransport,
    private val journal: CareAttemptJournal = MemoryCareJournal(),
    private val timeoutMs: Long = 20_000,
) {
    private val locks = ConcurrentHashMap<String, Mutex>()

    suspend fun save(owner: String, plant: Plant, date: String, action: String, details: String, next: String?) {
        PlantRules.requireCanonicalPlantId(plant.id)
        require(action.isNotBlank()) { "Choose a care action." }
        java.time.LocalDate.parse(date)
        next?.let { java.time.LocalDate.parse(it) }
        val key = kotlinx.serialization.json.JsonArray(
            listOf(owner, plant.id, date, action, details, next ?: "").map { kotlinx.serialization.json.JsonPrimitive(it) },
        ).toString()
        val lock = locks.getOrPut(plant.id) { Mutex() }
        check(lock.tryLock()) { "A care action is already saving for this plant. Please wait." }
        var logConfirmed = false
        try {
            val id = journal.get(key) ?: UUID.randomUUID().toString().also { journal.put(key, it) }
            withTimeout(timeoutMs) {
                var receipt = transport.findLog(id, owner)
                if (receipt == null) {
                    try {
                        transport.insertLog(CareLogInsert(id, owner, plant.id, date, plant.name, action, details, plant.location))
                    } catch (error: Exception) {
                        if (error is CancellationException) throw error
                        // An insert response may be lost even though Postgres committed it.
                        receipt = transport.findLog(id, owner)
                        if (receipt == null) throw error
                    }
                    if (receipt == null) receipt = transport.findLog(id, owner)
                }
                check(receipt?.let { it.id == id && it.userId == owner && it.plantId == plant.id && it.careDate == date && it.action == action && (it.details ?: "") == details } == true) {
                    "The care entry could not be verified."
                }
                logConfirmed = true
                val updated = transport.updateSchedule(plant.id, owner, date, action, next)
                check(updated.id == plant.id && updated.lastCare == date && updated.lastAction == action && updated.nextCheck == next) {
                    "The plant schedule update could not be verified."
                }
                journal.remove(key)
            }
        } catch (error: Exception) {
            if (error is CancellationException && error !is TimeoutCancellationException) throw error
            val message = if (logConfirmed) "Care entry saved; its schedule was not confirmed. Retry to finish safely."
                else "Care save was not confirmed. Retry safely."
            throw IllegalStateException("$message ${error.message ?: "Connection unavailable."}", error)
        } finally {
            lock.unlock()
        }
    }
}
