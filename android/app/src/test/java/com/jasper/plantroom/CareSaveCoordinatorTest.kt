package com.jasper.plantroom

import com.jasper.plantroom.net.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import java.io.IOException

private val carePlant = Plant("cc3c6a2e-238f-4f0d-9cb9-28d6fff5fcd8", "Spanish Moss — Big")
private class FakeCareTransport : CareTransport {
    val rows = mutableMapOf<String, CareReceipt>()
    var inserts = 0
    var failUpdate = false
    var loseInsertResponse = false
    var wrongSchedule = false
    var hang = false
    var lastNext: String? = "unset"
    override suspend fun findLog(id: String, owner: String): CareReceipt? {
        if (hang) delay(10_000)
        return rows[id]
    }
    override suspend fun insertLog(row: CareLogInsert) {
        inserts++
        rows[row.id] = CareReceipt(row.id, row.userId, row.plantId, row.careDate, row.action, row.details)
        if (loseInsertResponse) throw IOException("lost insert response")
    }
    override suspend fun updateSchedule(plantId: String, owner: String, date: String, action: String, next: String?): CareSchedule {
        if (failUpdate) throw IOException("connection lost")
        lastNext = next
        return CareSchedule(plantId, date, if (wrongSchedule) "Wrong" else action, next)
    }
}

class CareSaveCoordinatorTest {
    @Test fun `canonical UUID and NULL next check complete both writes`() = runBlocking {
        val t = FakeCareTransport()
        CareSaveCoordinator(t).save("owner", carePlant, "2026-10-12", "Reservoir topped up", "", null)
        assertEquals(1, t.inserts);assertNull(t.lastNext)
        assertEquals(carePlant.id, t.rows.values.single().plantId)
    }
    @Test fun `synthetic plant identity never reaches transport`() = runBlocking {
        val t = FakeCareTransport()
        assertTrue(runCatching { CareSaveCoordinator(t).save("owner", carePlant.copy(id="base:spanish-moss-big"), "2026-10-12", "Watered", "", null) }.isFailure)
        assertEquals(0, t.inserts)
    }
    @Test fun `failed schedule retry across coordinator recreation reuses one care row`() = runBlocking {
        val t = FakeCareTransport();val journal = MemoryCareJournal();t.failUpdate = true
        val failure = runCatching { CareSaveCoordinator(t,journal).save("owner",carePlant,"2026-10-12","Watered","","2026-10-14") }.exceptionOrNull()
        assertTrue(failure?.message?.contains("Care entry saved") == true)
        t.failUpdate = false
        CareSaveCoordinator(t,journal).save("owner",carePlant,"2026-10-12","Watered","","2026-10-14")
        assertEquals(1,t.inserts);assertEquals(1,t.rows.size)
    }
    @Test fun `lost insert response is confirmed without duplicate insertion`() = runBlocking {
        val t = FakeCareTransport();t.loseInsertResponse = true
        CareSaveCoordinator(t).save("owner",carePlant,"2026-10-12","Watered","",null)
        assertEquals(1,t.inserts);assertEquals(1,t.rows.size)
    }
    @Test fun `incorrect schedule is a failed save`() = runBlocking {
        val t = FakeCareTransport();t.wrongSchedule = true
        assertTrue(runCatching { CareSaveCoordinator(t).save("owner",carePlant,"2026-10-12","Watered","",null) }.isFailure)
    }
    @Test fun `timeout releases lock and preserves safe retry`() = runBlocking {
        val t = FakeCareTransport();t.hang = true;val c = CareSaveCoordinator(t,timeoutMs=10)
        assertTrue(runCatching { c.save("owner",carePlant,"2026-10-12","Watered","",null) }.isFailure)
        t.hang = false
        c.save("owner",carePlant,"2026-10-12","Watered","",null)
        assertEquals(1,t.inserts)
    }
}
