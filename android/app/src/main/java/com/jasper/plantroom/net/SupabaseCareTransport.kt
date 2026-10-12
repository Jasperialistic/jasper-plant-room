package com.jasper.plantroom.net

import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject

class SupabaseCareTransport : CareTransport {
    override suspend fun findLog(id: String, owner: String): CareReceipt? =
        PlantRepository.client.postgrest["care_log"].select {
            filter { eq("id", id); eq("user_id", owner) }
        }.decodeList<CareReceipt>().singleOrNull()

    override suspend fun insertLog(row: CareLogInsert) {
        PlantRepository.client.postgrest["care_log"].insert(row)
    }

    override suspend fun updateSchedule(plantId: String, owner: String, date: String, action: String, next: String?): CareSchedule =
        PlantRepository.client.postgrest["plants"].update(buildJsonObject {
            put("last_care", JsonPrimitive(date))
            put("last_action", JsonPrimitive(action))
            put("next_check", next?.let { JsonPrimitive(it) } ?: JsonNull)
        }) {
            filter { eq("id", plantId); eq("user_id", owner) }
            select()
        }.decodeSingle<CareSchedule>()
}
