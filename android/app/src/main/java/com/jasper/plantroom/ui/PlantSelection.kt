package com.jasper.plantroom.ui

import com.jasper.plantroom.net.Plant

/** Navigation target when a plant tile is tapped in the Plants grid. */
sealed interface PlantTileTarget {
    /** The plant's detail/card screen. The photo viewer opens from the detail photo only. */
    data class Detail(val plantId: String) : PlantTileTarget
}

/**
 * Cards and Grid share one selection rule (web parity): tapping a plant opens
 * its detail screen. Grid previously opened the photo viewer directly — that
 * route is intentionally absent from [PlantTileTarget].
 */
fun plantTileTarget(gridMode: Boolean, plant: Plant): PlantTileTarget =
    PlantTileTarget.Detail(plant.id)
