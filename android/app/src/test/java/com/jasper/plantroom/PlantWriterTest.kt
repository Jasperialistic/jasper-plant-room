package com.jasper.plantroom

import com.jasper.plantroom.net.PlantRules
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertNotNull
import org.junit.Test

class PlantWriterTest {

    @Test
    fun `watered derives next check from check days`() {
        assertEquals("2026-10-13", PlantRules.deriveNextCheck("Watered", 2, "2026-10-11"))
        assertEquals("2026-10-14", PlantRules.deriveNextCheck("Watered", 3, "2026-10-11"))
    }

    @Test
    fun `watered without check interval has no derived date`() {
        assertNull(PlantRules.deriveNextCheck("Watered", null, "2026-10-11"))
    }

    @Test
    fun `still moist rechecks next day`() {
        assertEquals("2026-10-12", PlantRules.deriveNextCheck("Checked — still moist", 5, "2026-10-11"))
    }

    @Test
    fun `custom actions do not invent a next check`() {
        assertNull(PlantRules.deriveNextCheck("Repotted", 5, "2026-10-11"))
    }

    @Test
    fun `slugify matches the web legacy id shape`() {
        assertEquals("monstera-aurea", PlantRules.slugify("Monstera aurea"))
        assertEquals("alocasia-black-velvet", PlantRules.slugify("Alocasia ‘Black Velvet’"))
        assertEquals("plant", PlantRules.slugify("!!!"))
    }

    @Test
    fun `validation rejects blank names and malformed fields`() {
        assertNotNull(PlantRules.validate("", "", ""))
        assertNotNull(PlantRules.validate("Ok", "two", ""))
        assertNotNull(PlantRules.validate("Ok", "", "not-a-date"))
        assertNull(PlantRules.validate("Ok", "", ""))
        assertNull(PlantRules.validate("Ok", "2", "2026-10-11"))
    }
}
