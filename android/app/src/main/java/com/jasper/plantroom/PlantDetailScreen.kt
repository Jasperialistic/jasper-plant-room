package com.jasper.plantroom

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.jasper.plantroom.net.Plant
import com.jasper.plantroom.net.PlantBasePhoto
import com.jasper.plantroom.net.PlantPhoto
import com.jasper.plantroom.net.PlantRepository
import com.jasper.plantroom.ui.theme.NoirColors

private sealed interface DetailState {
    data object Loading : DetailState
    data class Ready(val cloud: List<PlantPhoto>, val base: List<PlantBasePhoto>) : DetailState
    data class Failed(val message: String) : DetailState
}

@Composable
fun PlantDetailScreen(plant: Plant, owner: Boolean, onBack: () -> Unit) {
    var state by remember { mutableStateOf<DetailState>(DetailState.Loading) }
    var showUpload by remember { mutableStateOf(false) }
    var showEdit by remember { mutableStateOf(false) }
    var showCare by remember { mutableStateOf(false) }
    var refreshTick by remember { mutableStateOf(0) }
    var viewer by remember { mutableStateOf<Pair<List<com.jasper.plantroom.ui.PhotoSlide>, Int>?>(null) }
    viewer?.let { (slides, start) ->
        com.jasper.plantroom.ui.PhotoViewer(slides, start, title = plant.name) { viewer = null }
    }

    LaunchedEffect(plant.id, refreshTick) {
        state = try {
            DetailState.Ready(
                PlantRepository.loadPhotos(plant.id),
                PlantRepository.loadAllBasePhotos().filter { it.plantId == plant.id },
            )
        } catch (error: Exception) {
            DetailState.Failed(error.message ?: "Could not load photos")
        }
    }

    BoxWithConstraints(Modifier.fillMaxSize().background(NoirColors.Noir), contentAlignment = Alignment.Center) {
    val wide = maxWidth >= 840.dp // Fold8 unfolded inner screen
    LazyColumn(
        Modifier.fillMaxWidth().then(if (wide) Modifier.widthIn(max = 1180.dp) else Modifier),
        contentPadding = PaddingValues(bottom = 32.dp),
    ) {
        item {
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onBack) { Text("‹ COLLECTION", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne) }
                Spacer(Modifier.weight(1f))
                if (owner) {
                    TextButton(onClick = { showCare = true }) {
                        Text("LOG CARE", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
                    }
                    TextButton(onClick = { showUpload = true }) {
                        Text("ADD GROWTH PHOTOS", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
                    }
                    TextButton(onClick = { showEdit = true }) {
                        Text("EDIT", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
                    }
                }
            }
        }

        if (showEdit) {
            item {
                com.jasper.plantroom.ui.PlantEditSheet(plant = plant, onDismiss = { saved ->
                    showEdit = false
                    if (saved) refreshTick++
                })
            }
        }
        if (showCare) {
            item {
                com.jasper.plantroom.ui.CareLogSheet(plant = plant, onDismiss = { saved ->
                    showCare = false
                    if (saved) refreshTick++
                })
            }
        }

        if (showUpload) {
            item {
                com.jasper.plantroom.ui.GrowthUploadSheet(
                    plantId = plant.id,
                    plantName = plant.name,
                    onDismiss = { refreshed ->
                        showUpload = false
                        if (refreshed) refreshTick++
                    },
                )
            }
        }

        when (val current = state) {
            DetailState.Loading -> item {
                Box(Modifier.fillMaxWidth().height(220.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = NoirColors.Champagne)
                }
            }
            is DetailState.Failed -> item {
                Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(current.message, color = NoirColors.Muted, style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(12.dp))
                    OutlinedButton(onClick = { state = DetailState.Loading }) { Text("RETRY") }
                }
            }
            is DetailState.Ready -> {
                val cloud = current.cloud
                val base = current.base
                val cover = PlantRepository.coverUrl(cloud, base)
                val timeline = PlantRepository.growthTimeline(cloud)
                val gallery = PlantRepository.galleryPhotos(cloud)
                val baseGallery = base.filter { it.hidden != true && it.purged != true }
                    .sortedWith(compareBy({ it.sortOrder ?: 0 }, { it.assetPath ?: "" }))

                // web openPhotoLightbox: ONE deck = all of the plant's photos
                // (bundled collection + gallery + growth), swipeable from any tap.
                val allSlides = (
                    baseGallery.mapNotNull { p ->
                        p.assetPath?.let { a ->
                            com.jasper.plantroom.ui.PhotoSlide(
                                PlantRepository.webAssetUrl(a),
                                listOfNotNull(p.photoDate?.let { com.jasper.plantroom.ui.PlantRules.prettyDate(it) }, "Collection photo").joinToString(" · "),
                            )
                        }
                    } + gallery.mapNotNull { p ->
                        PlantRepository.displayUrl(p)?.let { u ->
                            com.jasper.plantroom.ui.PhotoSlide(
                                u,
                                listOfNotNull(p.photoDate?.let { com.jasper.plantroom.ui.PlantRules.prettyDate(it) }, p.note?.takeIf { it.isNotBlank() }).joinToString(" · "),
                            )
                        }
                    } + timeline.mapNotNull { p ->
                        PlantRepository.displayUrl(p)?.let { u ->
                            com.jasper.plantroom.ui.PhotoSlide(
                                u,
                                listOfNotNull(p.photoDate?.let { com.jasper.plantroom.ui.PlantRules.prettyDate(it) }, p.note?.takeIf { it.isNotBlank() }).joinToString(" · "),
                            )
                        }
                    }
                )

                item {
                    if (wide) {
                        // two-page spread: photo card left, identity + details right
                        Row(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 10.dp)) {
                            if (cover != null) {
                                AsyncImage(
                                    model = cover,
                                    contentDescription = plant.name,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.width(440.dp).height(320.dp).clip(RoundedCornerShape(18.dp))
                                        .clickable { viewer = allSlides to allSlides.indexOfFirst { it.url == cover }.coerceAtLeast(0) },
                                )
                            } else {
                                Box(Modifier.width(440.dp).height(320.dp).clip(RoundedCornerShape(18.dp)).background(NoirColors.CardBottom), contentAlignment = Alignment.Center) {
                                    Text("No photograph yet", color = NoirColors.Muted, style = MaterialTheme.typography.bodyMedium)
                                }
                            }
                            Spacer(Modifier.width(28.dp))
                            Column(Modifier.weight(1f)) {
                                Text(plant.name, style = MaterialTheme.typography.headlineMedium, color = NoirColors.Ivory)
                                Text(
                                    listOfNotNull(plant.group, plant.location).joinToString(" · ").ifBlank { "Specimen" },
                                    style = MaterialTheme.typography.labelMedium, color = NoirColors.ChampagneHi,
                                )
                                Spacer(Modifier.height(12.dp))
                                DetailRow("Light", plant.light)
                                DetailRow("Environment", plant.environment)
                                DetailRow("Pot", listOfNotNull(plant.pot, plant.potType).joinToString(" · ").ifBlank { null })
                                DetailRow("Outer pot", plant.outerPot)
                                DetailRow("Medium", plant.medium)
                                DetailRow("Watering", plant.wateringMode)
                                DetailRow("Last care", listOfNotNull(plant.lastCare, plant.lastAction).joinToString(" — ").ifBlank { null })
                                DetailRow("Next check", plant.nextCheck)
                                DetailRow("Rule", plant.checkRule)
                                DetailRow("Notes", plant.notes)
                            }
                        }
                    } else {
                    if (cover != null) {
                        AsyncImage(
                            model = cover,
                            contentDescription = plant.name,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxWidth().aspectRatio(4f / 3f)
                                .clickable { viewer = allSlides to allSlides.indexOfFirst { it.url == cover }.coerceAtLeast(0) },
                        )
                    } else {
                        Box(Modifier.fillMaxWidth().height(200.dp).background(NoirColors.CardBottom), contentAlignment = Alignment.Center) {
                            Text("No photograph yet", color = NoirColors.Muted, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                    Column(Modifier.padding(horizontal = 20.dp, vertical = 14.dp)) {
                        Text(plant.name, style = MaterialTheme.typography.headlineMedium, color = NoirColors.Ivory)
                        Text(
                            listOfNotNull(plant.group, plant.location).joinToString(" · ").ifBlank { "Specimen" },
                            style = MaterialTheme.typography.labelMedium, color = NoirColors.ChampagneHi,
                        )
                    }
                    }
                }

                if (!wide) item {
                    Column(Modifier.padding(horizontal = 20.dp)) {
                        DetailRow("Light", plant.light)
                        DetailRow("Environment", plant.environment)
                        DetailRow("Pot", listOfNotNull(plant.pot, plant.potType).joinToString(" · ").ifBlank { null })
                        DetailRow("Outer pot", plant.outerPot)
                        DetailRow("Medium", plant.medium)
                        DetailRow("Watering", plant.wateringMode)
                        DetailRow("Last care", listOfNotNull(plant.lastCare, plant.lastAction).joinToString(" — ").ifBlank { null })
                        DetailRow("Next check", plant.nextCheck)
                        DetailRow("Rule", plant.checkRule)
                        DetailRow("Notes", plant.notes)
                    }
                }

                item {
                    SectionTitle("GROWTH HISTORY")
                }
                if (timeline.isEmpty()) {
                    item {
                        Text(
                            "No growth photos recorded yet.",
                            color = NoirColors.Muted, style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(horizontal = 20.dp),
                        )
                    }
                } else {
                    items(timeline, key = { "growth:${it.id}" }) { photo ->
                        val slideUrl = PlantRepository.displayUrl(photo)
                        PhotoRow(
                            url = slideUrl,
                            date = photo.photoDate,
                            note = photo.note,
                            onClick = {
                                viewer = allSlides to allSlides.indexOfFirst { it.url == slideUrl }.coerceAtLeast(0)
                            },
                        )
                    }
                }

                item {
                    SectionTitle("COLLECTION PHOTOS")
                }
                val baseCount = baseGallery.size
                if (baseGallery.isEmpty() && gallery.isEmpty()) {
                    item {
                        Text(
                            "No collection photos yet.",
                            color = NoirColors.Muted, style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(horizontal = 20.dp),
                        )
                    }
                } else {
                    items(baseGallery, key = { "base:${it.id}" }) { photo ->
                        val slideUrl = photo.assetPath?.let { PlantRepository.webAssetUrl(it) }
                        PhotoRow(
                            url = slideUrl,
                            date = photo.photoDate,
                            note = "Bundled collection photo",
                            onClick = {
                                viewer = allSlides to allSlides.indexOfFirst { it.url == slideUrl }.coerceAtLeast(0)
                            },
                        )
                    }
                    items(gallery, key = { "gallery:${it.id}" }) { photo ->
                        val slideUrl = PlantRepository.displayUrl(photo)
                        PhotoRow(
                            url = slideUrl,
                            date = photo.photoDate,
                            note = photo.note,
                            onClick = {
                                viewer = allSlides to allSlides.indexOfFirst { it.url == slideUrl }.coerceAtLeast(0)
                            },
                        )
                    }
                }
            }
        }
    }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.labelMedium,
        color = NoirColors.Champagne,
        modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 22.dp, bottom = 10.dp),
    )
}

@Composable
private fun DetailRow(label: String, value: String?) {
    if (value.isNullOrBlank()) return
    Row(Modifier.fillMaxWidth().padding(vertical = 7.dp)) {
        Text(label.uppercase(), style = MaterialTheme.typography.labelMedium, color = NoirColors.Muted, modifier = Modifier.width(104.dp))
        Text(value, style = MaterialTheme.typography.bodyMedium, color = NoirColors.Ivory, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun PhotoRow(url: String?, date: String?, note: String?, onClick: () -> Unit = {}) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = NoirColors.CardTop),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 5.dp)
            .clickable(onClick = onClick),
    ) {
        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
            if (url != null) {
                AsyncImage(
                    model = url,
                    contentDescription = date ?: "Photo",
                    contentScale = ContentScale.Crop,
                    // Thumbnails render at tile size; full originals load only on demand.
                    modifier = Modifier.width(72.dp).height(88.dp).clip(RoundedCornerShape(12.dp)),
                )
                Spacer(Modifier.width(14.dp))
            }
            Column {
                Text(
                    if (date.isNullOrBlank()) "Undated" else com.jasper.plantroom.ui.PlantRules.prettyDate(date),
                    style = MaterialTheme.typography.titleMedium, color = NoirColors.Ivory,
                )
                if (!note.isNullOrBlank()) {
                    Text(note, style = MaterialTheme.typography.bodyMedium, color = NoirColors.Muted)
                }
            }
        }
    }
}
