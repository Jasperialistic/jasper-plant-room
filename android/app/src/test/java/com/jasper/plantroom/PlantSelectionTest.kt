package com.jasper.plantroom

import com.jasper.plantroom.net.Plant
import com.jasper.plantroom.ui.PlantTileTarget
import com.jasper.plantroom.ui.plantTileTarget
import org.junit.Assert.assertEquals
import org.junit.Test

private val gridPlant = Plant("cc3c6a2e-238f-4f0d-9cb9-28d6fff5fcd8", "Spanish Moss — Big")

class PlantSelectionTest {
    @Test fun `grid tile tap opens the plant detail screen`() {
        assertEquals(PlantTileTarget.Detail(gridPlant.id), plantTileTarget(gridMode = true, plant = gridPlant))
    }

    @Test fun `card tile tap keeps the same plant detail target`() {
        assertEquals(PlantTileTarget.Detail(gridPlant.id), plantTileTarget(gridMode = false, plant = gridPlant))
    }
}
