package com.jasper.plantroom.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.jasper.plantroom.net.Plant
import com.jasper.plantroom.ui.theme.NoirColors
import com.jasper.plantroom.ui.theme.PrBodoni
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

private val ChipBg = Color(0x22C9B18A)

/**
 * Care rules mirrored VERBATIM from the web (index.html:1653-1655).
 */
object PlantRules {

    private val fmt = DateTimeFormatter.ofPattern("MMM d, yyyy")

    fun isReservoir(plant: Plant): Boolean =
        (plant.wateringMode ?: "").lowercase().contains("reservoir")

    /** web statusOf(): "reservoir" | "none" | "overdue" | "today" | "upcoming" */
    fun statusOf(plant: Plant): String {
        if (isReservoir(plant)) return "reservoir"
        val next = plant.nextCheck ?: return "none"
        val diff = runCatching {
            ChronoUnit.DAYS.between(LocalDate.now(), LocalDate.parse(next.take(10)))
        }.getOrDefault(0L)
        return when {
            diff < 0 -> "overdue"
            diff == 0L -> "today"
            else -> "upcoming"
        }
    }

    fun prettyDate(iso: String?): String {
        if (iso.isNullOrBlank()) return "—"
        return runCatching { LocalDate.parse(iso.take(10)).format(fmt) }.getOrDefault(iso)
    }
}

internal fun statusLabel(status: String): String = when (status) {
    "overdue" -> "Overdue"
    "today" -> "Check today"
    "reservoir" -> "Reservoir"
    else -> "Upcoming"
}

/**
 * Web .stat tile: small caps label on top, big value below.
 * tint: web colors the "Check today" value champagne and "Overdue" warm red.
 */
@Composable
fun StatTile(label: String, value: String, tint: Color = NoirColors.Ivory, modifier: Modifier = Modifier) {
    Column(
        modifier
            .clip(RoundedCornerShape(18.dp))
            .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
            .padding(18.dp)
    ) {
        Text(
            label, color = NoirColors.Muted, fontSize = 13.sp,
            maxLines = 2, overflow = TextOverflow.Ellipsis
        )
        Spacer(Modifier.height(7.dp))
        Text(value, color = tint, fontFamily = PrBodoni, fontWeight = FontWeight.Medium, fontSize = 31.sp)
    }
}

@Composable
fun Chip(text: String) {
    Box(
        Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(ChipBg)
            .padding(horizontal = 9.dp, vertical = 3.dp)
    ) {
        Text(text, color = NoirColors.Champagne, fontSize = 11.sp, fontWeight = FontWeight.Medium)
    }
}

/**
 * Web .plant-card: photo, plant-top (name + sub=location + status chip for
 * owner), chips (group · pot · mode), owner care-line (Last care / Next check).
 */
@Composable
fun PlantPhotoCard(plant: Plant, photoUrl: String?, owner: Boolean, onClick: () -> Unit) {
    val status = PlantRules.statusOf(plant)
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
            .clickable(onClick = onClick)
    ) {
        Column {
            Box(
                Modifier
                    .fillMaxWidth()
                    .aspectRatio(4f / 3f)
                    .clip(RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp))
                    .background(NoirColors.CardBottom)
            ) {
                if (!photoUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = photoUrl,
                        contentDescription = plant.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Text("\uD83C\uDF31", fontSize = 40.sp, modifier = Modifier.align(Alignment.Center))
                }
            }
            Column(Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(
                            plant.name, color = NoirColors.Ivory, fontFamily = PrBodoni, fontWeight = FontWeight.Medium,
                            fontSize = 16.sp, maxLines = 1, overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            plant.location ?: "",
                            color = NoirColors.Muted, fontSize = 12.sp, maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    if (owner) Chip(statusLabel(status))
                }
                Spacer(Modifier.height(13.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Chip(plant.group ?: "Plant")
                    plant.pot?.takeIf { it.isNotBlank() }?.let { Chip(it) }
                    plant.wateringMode?.takeIf { it.isNotBlank() }?.let { Chip(it) }
                }
                if (owner) {
                    Spacer(Modifier.height(13.dp))
                    HorizontalDivider(color = Color(0x2EC9B18A), thickness = 1.dp)
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text("Last care", color = NoirColors.Muted, fontSize = 9.5.sp, letterSpacing = 1.sp)
                            Text(
                                PlantRules.prettyDate(plant.lastCare),
                                color = NoirColors.ChampagneHi, fontSize = 12.5.sp, fontWeight = FontWeight.Medium
                            )
                        }
                        Column(Modifier.weight(1f)) {
                            Text("Next check", color = NoirColors.Muted, fontSize = 9.5.sp, letterSpacing = 1.sp)
                            Text(
                                plant.nextCheck?.let { PlantRules.prettyDate(it) } ?: "Reservoir-based",
                                color = NoirColors.ChampagneHi, fontSize = 12.5.sp, fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Web .queue-item: thumb, name, sub (owner: "location · check date";
 * visitor: "group · location"), status chip for owner.
 */
@Composable
fun QueueRow(
    plant: Plant,
    photoUrl: String?,
    owner: Boolean,
    careBusy: Boolean = false,
    onMoist: () -> Unit = {},
    onWatered: () -> Unit = {},
    onReservoir: () -> Unit = {},
    onCustom: () -> Unit = {},
    onClick: () -> Unit,
) {
    val status = PlantRules.statusOf(plant)
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
            .clickable(onClick = onClick)
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(NoirColors.CardBottom)
        ) {
            if (!photoUrl.isNullOrBlank()) {
                AsyncImage(photoUrl, null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
            }
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(plant.name, color = NoirColors.Ivory, fontFamily = PrBodoni, fontSize = 14.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(
                if (owner) "${plant.location ?: "Plant room"}" +
                    (plant.nextCheck?.let { " · check ${PlantRules.prettyDate(it)}" } ?: "")
                else listOfNotNull(plant.group, plant.location).joinToString(" · ").ifBlank { "Plant" },
                color = NoirColors.Muted, fontSize = 11.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis
            )
            if (owner) {
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    QuickCareButton(if (careBusy) "Saving…" else "Still moist", !careBusy, onMoist)
                    QuickCareButton(if (careBusy) "Saving…" else "Watered", !careBusy, onWatered)
                }
            }
        }
        if (owner) {
            Spacer(Modifier.width(8.dp))
            Chip(statusLabel(status))
        }
    }
}

/**
 * Web .timeline-item: date column + strong "plant · action" + "details · location".
 */
@Composable
fun CareLogRow(date: String, plant: String, action: String, details: String, location: String) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
            .padding(12.dp)
    ) {
        Column(Modifier.width(88.dp)) {
            Text(date, color = NoirColors.Champagne, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold)
        }
        Column(Modifier.weight(1f)) {
            Text(
                "$plant · $action", color = NoirColors.Ivory, fontSize = 13.5.sp,
                fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis
            )
            val second = listOf(details, location).filter { it.isNotBlank() }.joinToString(" · ")
            if (second.isNotBlank()) {
                Text(second, color = NoirColors.Muted, fontSize = 11.5.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

/** web speciesOf() (v47:827). */
fun speciesOf(plant: Plant): String {
    val g = (plant.group ?: "").trim().lowercase()
    return when {
        g.contains("anthurium") -> "anthurium"
        g.contains("alocasia") -> "alocasia"
        g.contains("philodendron") -> "philodendron"
        else -> "other"
    }
}

/** web #v414SpeciesStats: counts by plant group, tap opens Plants filtered. */
@Composable
fun SpeciesStrip(plants: List<Plant>, onSpecies: (String) -> Unit) {
    val counts = mapOf(
        "anthurium" to plants.count { speciesOf(it) == "anthurium" },
        "alocasia" to plants.count { speciesOf(it) == "alocasia" },
        "philodendron" to plants.count { speciesOf(it) == "philodendron" },
        "other" to plants.count { speciesOf(it) == "other" },
    )
    val labels = mapOf("anthurium" to "Anthurium", "alocasia" to "Alocasia", "philodendron" to "Philodendron", "other" to "Others")
    val accents = mapOf(
        "anthurium" to Color(0xFFD8C49A), "alocasia" to Color(0xFFA8CDB9),
        "philodendron" to Color(0xFFB6C9A4), "other" to NoirColors.Muted,
    )
    Row(horizontalArrangement = Arrangement.spacedBy(5.dp), modifier = Modifier.fillMaxWidth()) {
        listOf("anthurium", "alocasia", "philodendron", "other").forEach { key ->
            Column(
                Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
                    .clickable { onSpecies(key) }
                    .padding(vertical = 10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    counts[key].toString(), color = accents[key] ?: NoirColors.Ivory,
                    fontFamily = PrBodoni, fontWeight = FontWeight.Medium, fontSize = 21.sp,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    labels[key] ?: "", color = NoirColors.Muted, fontSize = 9.sp,
                    maxLines = 1, overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

/** Owner dashboard quick care (web addCare actions). */
@Composable
private fun QuickCareButton(text: String, enabled: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(Brush.verticalGradient(listOf(NoirColors.Champagne, NoirColors.ChampagneHi)))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 11.dp, vertical = 5.dp)
    ) {
        Text(text, color = NoirColors.OnChampagne, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}

/** Instagram-style square grid tile (view switcher "Grid" mode). */
@Composable
fun SquareTile(plant: Plant, photoUrl: String?, onClick: () -> Unit) {
    Box(
        Modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .clip(RoundedCornerShape(4.dp))
            .background(NoirColors.CardBottom)
            .clickable(onClick = onClick)
    ) {
        if (!photoUrl.isNullOrBlank()) {
            AsyncImage(
                model = photoUrl,
                contentDescription = plant.name,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Text("\uD83C\uDF31", fontSize = 26.sp, modifier = Modifier.align(Alignment.Center))
        }
    }
}

/** Web .empty block. */
@Composable
fun EmptyState(text: String) {
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(NoirColors.CardTop)
            .padding(vertical = 28.dp, horizontal = 18.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(text, color = NoirColors.Muted, fontSize = 13.sp)
    }
}
