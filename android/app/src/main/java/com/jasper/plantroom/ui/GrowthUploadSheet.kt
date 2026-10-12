package com.jasper.plantroom.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import coil3.compose.AsyncImage
import com.jasper.plantroom.net.GrowthUploadCoordinator
import com.jasper.plantroom.net.PendingPhoto
import com.jasper.plantroom.net.PhotoPreparer
import com.jasper.plantroom.net.SupabaseWriteTransport
import com.jasper.plantroom.net.UploadState
import com.jasper.plantroom.net.newUploadId
import com.jasper.plantroom.ui.theme.NoirColors
import kotlinx.coroutines.launch
import java.time.LocalDate

/**
 * Owner-only growth-photo upload flow: native Photo Picker (no storage
 * permission), per-photo preview and status, bounded queue with retry/cancel.
 * Writes require an authenticated owner session; visitors never reach this UI.
 */
@Composable
fun GrowthUploadSheet(
    plantId: String,
    plantName: String,
    onDismiss: (refreshed: Boolean) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val coordinator = remember { GrowthUploadCoordinator(SupabaseWriteTransport(), maxConcurrency = if ((context.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager).isLowRamDevice) 1 else 2) }
    val items by coordinator.items.collectAsState()

    var picked by remember { mutableStateOf<List<Pair<String, android.net.Uri>>>(emptyList()) }
    var photoDate by remember { mutableStateOf(LocalDate.now().toString()) }
    var note by remember { mutableStateOf("") }
    var running by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val picker = rememberLauncherForActivityResult(
        ActivityResultContracts.PickMultipleVisualMedia(20)
    ) { uris ->
        val known = picked.map { it.second }.toSet()
        picked = picked + uris.filter { it !in known }.mapIndexed { index, uri -> "${newUploadId().take(8)}-$index" to uri }
    }

    Dialog(onDismissRequest = { if (!running) onDismiss(items.any { it.state == UploadState.COMPLETE }) }) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = NoirColors.CardTop,
            tonalElevation = 8.dp,
        ) {
            Column(Modifier.sizeIn(maxHeight = 680.dp).padding(20.dp).verticalScroll(rememberScrollState())) {
                Text("ADD GROWTH PHOTOS", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
                Text(plantName, style = MaterialTheme.typography.titleLarge, color = NoirColors.Ivory)
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                Spacer(Modifier.height(12.dp))

                OutlinedTextField(
                    value = photoDate, onValueChange = { photoDate = it },
                    label = { Text("Growth date (YYYY-MM-DD)") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = note, onValueChange = { note = it },
                    label = { Text("Observation (optional)") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(12.dp))

                if (picked.isEmpty()) {
                    OutlinedButton(
                        onClick = {
                            picker.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        shape = RoundedCornerShape(50),
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("SELECT PHOTOS (NATIVE PICKER)") }
                } else {
                    LazyColumn(Modifier.height(180.dp)) {
                        items(picked, key = { it.first }) { (id, uri) ->
                            val status = items.firstOrNull { it.id == id }
                            Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                                AsyncImage(
                                    model = uri,
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.size(52.dp).clip(RoundedCornerShape(10.dp)),
                                )
                                Spacer(Modifier.width(10.dp))
                                Column(Modifier.weight(1f)) {
                                    Text("Photo", style = MaterialTheme.typography.bodyMedium, color = NoirColors.Ivory)
                                    Text(
                                        (status?.state ?: UploadState.QUEUED).name.lowercase()
                                            .replaceFirstChar { it.uppercase() } +
                                            (status?.error?.let { " — $it" } ?: ""),
                                        style = MaterialTheme.typography.labelMedium,
                                        color = if (status?.state == UploadState.FAILED) MaterialTheme.colorScheme.error else NoirColors.Muted,
                                    )
                                }
                                if (status == null && !running) {
                                    TextButton(onClick = { picked = picked.filterNot { it.first == id } }) { Text("Remove") }
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(
                            onClick = {
                                if (runCatching { LocalDate.parse(photoDate.trim()) }.isFailure) {
                                    error = "Growth date must be a date like 2026-10-12."
                                    return@Button
                                }
                                running = true
                                error = null
                                coordinator.enqueue(
                                    plantId, photoDate.trim(), note.trim(),
                                    picked.map { (id, uri) ->
                                        PendingPhoto(id, "growth-$id.jpg") {
                                            PhotoPreparer.prepare(context, uri, "growth-$id.jpg")
                                        }
                                    },
                                )
                                scope.launch {
                                    try { coordinator.run() }
                                    catch (e: kotlinx.coroutines.CancellationException) { throw e }
                                    catch (e: Exception) { error = e.message ?: "Upload failed. Retry safely." }
                                    finally { running = false }
                                }
                            },
                            enabled = !running && picked.any { photo -> items.none { it.id == photo.first } },
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = NoirColors.Champagne,
                                contentColor = NoirColors.OnChampagne,
                            ),
                        ) { Text(if (running) "UPLOADING…" else "UPLOAD ${picked.size}") }
                        if (running) {
                            OutlinedButton(onClick = { coordinator.cancel() }, shape = RoundedCornerShape(50)) { Text("CANCEL") }
                        } else {
                            OutlinedButton(
                                onClick = {
                                    picker.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                },
                                shape = RoundedCornerShape(50),
                            ) { Text("ADD MORE") }
                            TextButton(onClick = { onDismiss(items.any { it.state == UploadState.COMPLETE }) }) { Text("CLOSE") }
                        }
                    }
                }

                val failed = items.count { it.state == UploadState.FAILED || it.state == UploadState.CANCELLED }
                if (failed > 0 && !running) {
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "$failed photo${if (failed == 1) "" else "s"} failed. Retry below — successful photos are kept.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error,
                    )
                    OutlinedButton(
                        onClick = {
                            running = true
                            scope.launch {
                                try { coordinator.run(resumeCancelled = true) }
                                catch (e: kotlinx.coroutines.CancellationException) { throw e }
                                catch (e: Exception) { error = e.message ?: "Upload failed. Retry safely." }
                                finally { running = false }
                            }
                        },
                        shape = RoundedCornerShape(50),
                    ) { Text("RETRY FAILED") }
                }
            }
        }
    }
}
