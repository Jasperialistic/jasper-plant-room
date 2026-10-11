package com.jasper.plantroom.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
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
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

private val ChipBg = Color(0x22C9B18A)

/**
 * Care rules mirrored VERBATIM from the web (index.html:1653-1655):
 * isReservoir = watering mode contains "reservoir";
 * statusOf: no nextCheck -> none; past = overdue; today = today; future = upcoming.
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

/** Photo card mirroring the web plant-card: photo top, name, sub, chips, care line. */
@Composable
fun PlantPhotoCard(plant: Plant, photoUrl: String?, onClick: () -> Unit) {
    val status = PlantRules.statusOf(plant)
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
            .clickable(onClick = onClick)
    ) {
        Column {
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(172.dp)
                    .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
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
                    Text(
                        "\uD83C\uDF31", fontSize = 40.sp,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
            }
            Column(Modifier.padding(14.dp)) {
                Text(
                    plant.name, color = NoirColors.Ivory, fontWeight = FontWeight.Medium,
                    fontSize = 16.sp, maxLines = 1, overflow = TextOverflow.Ellipsis
                )
                Text(
                    listOfNotNull(plant.group, plant.location).joinToString(" · ").ifBlank { "Specimen" },
                    color = NoirColors.Muted, fontSize = 12.5.sp, maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Chip(statusLabel(status))
                    plant.group?.let { Chip(it) }
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    "Last care ${PlantRules.prettyDate(plant.lastCare)} · Next check " +
                        (plant.nextCheck?.let { PlantRules.prettyDate(it) } ?: "Reservoir-based"),
                    color = NoirColors.Muted, fontSize = 11.5.sp, maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
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

/** Stat tile mirroring the web .stat cards. */
@Composable
fun StatTile(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
            .padding(horizontal = 12.dp, vertical = 12.dp)
            .widthIn(min = 78.dp)
    ) {
        Text(value, color = NoirColors.Ivory, fontWeight = FontWeight.SemiBold, fontSize = 19.sp)
        Spacer(Modifier.height(3.dp))
        Text(
            label.uppercase(), color = NoirColors.Muted, fontSize = 9.5.sp,
            letterSpacing = 0.8.sp, maxLines = 1, overflow = TextOverflow.Ellipsis
        )
    }
}

/** Care-queue row mirroring the web queue rows (thumb + name + status). */
@Composable
fun QueueRow(plant: Plant, photoUrl: String?, owner: Boolean, onClick: () -> Unit) {
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
            Text(plant.name, color = NoirColors.Ivory, fontSize = 14.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(
                if (owner) "${plant.location ?: "Plant room"}" +
                    (plant.nextCheck?.let { " · check ${PlantRules.prettyDate(it)}" } ?: "")
                else listOfNotNull(plant.group, plant.location).joinToString(" · ").ifBlank { "Plant" },
                color = NoirColors.Muted, fontSize = 11.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis
            )
        }
        if (owner) {
            Spacer(Modifier.width(8.dp))
            Chip(statusLabel(status))
        }
    }
}

/** Care-log timeline row mirroring the web timeline items. */
@Composable
fun CareLogRow(date: String, action: String, plant: String, details: String, location: String) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
            .padding(12.dp)
    ) {
        Column(Modifier.width(84.dp)) {
            Text(date, color = NoirColors.Champagne, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold)
        }
        Column(Modifier.weight(1f)) {
            Text(
                "$action · $plant", color = NoirColors.Ivory, fontSize = 13.5.sp,
                fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis
            )
            if (details.isNotBlank()) {
                Text(details, color = NoirColors.Muted, fontSize = 11.5.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
            if (location.isNotBlank()) {
                Text(location, color = NoirColors.Muted, fontSize = 10.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

/** Simple centered empty state, matching the web .empty blocks. */
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
