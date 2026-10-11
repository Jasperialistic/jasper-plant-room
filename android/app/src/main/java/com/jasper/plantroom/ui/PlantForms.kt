package com.jasper.plantroom.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.jasper.plantroom.net.Plant
import com.jasper.plantroom.net.PlantRules
import com.jasper.plantroom.net.PlantUpdate
import com.jasper.plantroom.net.PlantWriter
import com.jasper.plantroom.ui.theme.NoirColors
import kotlinx.coroutines.launch

private val careActions = listOf("Watered", "Checked — still moist", "Reservoir topped up", "Repotted", "Other")

/**
 * Owner edit form for an existing plant — the exact field set and meanings of
 * the web editor. Unsaved changes prompt before dismissal.
 */
@Composable
fun PlantEditSheet(plant: Plant, onDismiss: (saved: Boolean) -> Unit) {
    var name by remember { mutableStateOf(plant.name) }
    var group by remember { mutableStateOf(plant.group ?: "") }
    var location by remember { mutableStateOf(plant.location ?: "") }
    var light by remember { mutableStateOf(plant.light ?: "") }
    var environment by remember { mutableStateOf(plant.environment ?: "") }
    var pot by remember { mutableStateOf(plant.pot ?: "") }
    var potType by remember { mutableStateOf(plant.potType ?: "") }
    var outer by remember { mutableStateOf(plant.outerPot ?: "") }
    var medium by remember { mutableStateOf(plant.medium ?: "") }
    var mode by remember { mutableStateOf(plant.wateringMode ?: "") }
    var lastCare by remember { mutableStateOf(plant.lastCare ?: "") }
    var lastAction by remember { mutableStateOf(plant.lastAction ?: "") }
    var nextCheck by remember { mutableStateOf(plant.nextCheck ?: "") }
    var checkDays by remember { mutableStateOf(plant.checkDays?.toString() ?: "") }
    var rule by remember { mutableStateOf(plant.checkRule ?: "") }
    var notes by remember { mutableStateOf(plant.notes ?: "") }
    var confidence by remember { mutableStateOf(plant.confidence ?: "") }

    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    var confirmDiscard by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    val initial = listOf(plant.name, plant.group, plant.location, plant.light, plant.environment, plant.pot,
        plant.potType, plant.outerPot, plant.medium, plant.wateringMode, plant.lastCare, plant.lastAction,
        plant.nextCheck, plant.checkDays?.toString(), plant.checkRule, plant.notes, plant.confidence)
    val dirty = listOf(name, group, location, light, environment, pot, potType, outer, medium, mode,
        lastCare, lastAction, nextCheck, checkDays, rule, notes, confidence) != initial.map { it ?: "" }

    fun dismissGuarded(saved: Boolean) {
        if (!saved && dirty) confirmDiscard = true else onDismiss(saved)
    }

    Dialog(onDismissRequest = { dismissGuarded(false) }) {
        Surface(shape = RoundedCornerShape(22.dp), color = NoirColors.CardTop) {
            Column(Modifier.padding(20.dp).verticalScroll(rememberScrollState())) {
                Text("EDIT SPECIMEN", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
                Spacer(Modifier.height(10.dp))
                Field("Name *", name) { name = it }
                Field("Group", group) { group = it }
                Field("Location / zone", location) { location = it }
                Field("Light", light) { light = it }
                Field("Environment", environment) { environment = it }
                Field("Pot", pot) { pot = it }
                Field("Pot type", potType) { potType = it }
                Field("Outer pot", outer) { outer = it }
                Field("Medium", medium) { medium = it }
                Field("Watering mode", mode) { mode = it }
                Field("Last care (YYYY-MM-DD)", lastCare) { lastCare = it }
                Field("Last action", lastAction) { lastAction = it }
                Field("Next check (YYYY-MM-DD)", nextCheck) { nextCheck = it }
                Field("Check interval (days)", checkDays) { checkDays = it }
                Field("Check rule", rule) { rule = it }
                Field("Notes", notes) { notes = it }
                Field("Confidence", confidence) { confidence = it }

                error?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(Modifier.height(14.dp))
                Row {
                    TextButton(onClick = { dismissGuarded(false) }) { Text("CANCEL", color = NoirColors.Muted) }
                    Spacer(Modifier.weight(1f))
                    Button(
                        onClick = {
                            val validation = PlantRules.validate(name, checkDays, nextCheck)
                            if (validation != null) {
                                error = validation
                            } else {
                                busy = true
                                error = null
                                scope.launch {
                                    try {
                                        PlantWriter.updatePlant(
                                            plant.id,
                                            PlantUpdate(
                                                name = name.trim(), group = group.trim().ifBlank { null },
                                                location = location.trim().ifBlank { null }, light = light.trim().ifBlank { null },
                                                environment = environment.trim().ifBlank { null }, pot = pot.trim().ifBlank { null },
                                                potType = potType.trim().ifBlank { null }, outerPot = outer.trim().ifBlank { null },
                                                medium = medium.trim().ifBlank { null }, wateringMode = mode.trim().ifBlank { null },
                                                lastCare = lastCare.trim().ifBlank { null }, lastAction = lastAction.trim().ifBlank { null },
                                                nextCheck = nextCheck.trim().ifBlank { null },
                                                checkDays = checkDays.trim().toIntOrNull(),
                                                checkRule = rule.trim().ifBlank { null }, notes = notes.trim().ifBlank { null },
                                                confidence = confidence.trim().ifBlank { null },
                                            ),
                                        )
                                        onDismiss(true)
                                    } catch (e: Exception) {
                                        error = e.message ?: "Save failed"
                                    } finally {
                                        busy = false
                                    }
                                }
                            }
                        },
                        enabled = !busy,
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = NoirColors.Champagne, contentColor = NoirColors.OnChampagne),
                    ) { Text(if (busy) "SAVING…" else "SAVE") }
                }
            }
        }
    }

    if (confirmDiscard) {
        AlertDialog(
            onDismissRequest = { confirmDiscard = false },
            title = { Text("Discard changes?") },
            text = { Text("This specimen has unsaved edits.") },
            confirmButton = {
                TextButton(onClick = { confirmDiscard = false; onDismiss(false) }) { Text("DISCARD") }
            },
            dismissButton = {
                TextButton(onClick = { confirmDiscard = false }) { Text("KEEP EDITING") }
            },
        )
    }
}

/** Care-event entry matching the web's addCare semantics and derivation rules. */
@Composable
fun CareLogSheet(plant: Plant, onDismiss: (saved: Boolean) -> Unit) {
    var action by remember { mutableStateOf(careActions.first()) }
    var details by remember { mutableStateOf("") }
    var nextCheck by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Dialog(onDismissRequest = { if (!busy) onDismiss(false) }) {
        Surface(shape = RoundedCornerShape(22.dp), color = NoirColors.CardTop) {
            Column(Modifier.padding(20.dp)) {
                Text("LOG CARE", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
                Text(plant.name, style = MaterialTheme.typography.titleLarge, color = NoirColors.Ivory)
                Spacer(Modifier.height(12.dp))
                Text("ACTION", style = MaterialTheme.typography.labelMedium, color = NoirColors.Muted)
                Row(Modifier.fillMaxWidth()) {
                    careActions.forEach { candidate ->
                        TextButton(onClick = { action = candidate }) {
                            Text(
                                candidate,
                                style = MaterialTheme.typography.labelMedium,
                                color = if (candidate == action) NoirColors.Champagne else NoirColors.Muted,
                            )
                        }
                    }
                }
                Field("Details", details) { details = it }
                Field("Next check (optional, YYYY-MM-DD)", nextCheck) { nextCheck = it }
                val derived = if (nextCheck.isBlank()) {
                    PlantRules.deriveNextCheck(action, plant.checkDays, java.time.LocalDate.now().toString())
                } else null
                if (derived != null) {
                    Text("Will schedule next check: $derived", style = MaterialTheme.typography.labelMedium, color = NoirColors.Muted)
                }
                error?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(Modifier.height(14.dp))
                Row {
                    TextButton(onClick = { onDismiss(false) }) { Text("CANCEL", color = NoirColors.Muted) }
                    Spacer(Modifier.weight(1f))
                    Button(
                        onClick = {
                            busy = true
                            scope.launch {
                                try {
                                    val next = nextCheck.trim().ifBlank {
                                        PlantRules.deriveNextCheck(action, plant.checkDays, java.time.LocalDate.now().toString())
                                    }
                                    PlantWriter.addCare(plant, action, details.trim(), next)
                                    onDismiss(true)
                                } catch (e: Exception) {
                                    error = e.message ?: "Save failed"
                                } finally {
                                    busy = false
                                }
                            }
                        },
                        enabled = !busy,
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = NoirColors.Champagne, contentColor = NoirColors.OnChampagne),
                    ) { Text(if (busy) "SAVING…" else "SAVE CARE") }
                }
            }
        }
    }
}

/** Create-plant form: required name plus the web's optional profile fields. */
@Composable
fun AddPlantSheet(onDismiss: (saved: Boolean) -> Unit) {
    var name by remember { mutableStateOf("") }
    var group by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Dialog(onDismissRequest = { if (!busy) onDismiss(false) }) {
        Surface(shape = RoundedCornerShape(22.dp), color = NoirColors.CardTop) {
            Column(Modifier.padding(20.dp)) {
                Text("ADD PLANT", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
                Spacer(Modifier.height(10.dp))
                Field("Name *", name) { name = it }
                Field("Group", group) { group = it }
                Field("Location / zone", location) { location = it }
                Field("Notes", notes) { notes = it }
                error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium) }
                Spacer(Modifier.height(14.dp))
                Row {
                    TextButton(onClick = { onDismiss(false) }) { Text("CANCEL", color = NoirColors.Muted) }
                    Spacer(Modifier.weight(1f))
                    Button(
                        onClick = {
                            val validation = PlantRules.validate(name, "", "")
                            if (validation != null) {
                                error = validation
                            } else {
                                busy = true
                                scope.launch {
                                    try {
                                        PlantWriter.createPlant(
                                            PlantUpdate(
                                                name = name.trim(),
                                                group = group.trim().ifBlank { null },
                                                location = location.trim().ifBlank { null },
                                                notes = notes.trim().ifBlank { null },
                                            ),
                                            legacyId = PlantRules.slugify(name),
                                        )
                                        onDismiss(true)
                                    } catch (e: Exception) {
                                        error = e.message ?: "Save failed"
                                    } finally {
                                        busy = false
                                    }
                                }
                            }
                        },
                        enabled = !busy,
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = NoirColors.Champagne, contentColor = NoirColors.OnChampagne),
                    ) { Text(if (busy) "SAVING…" else "ADD") }
                }
            }
        }
    }
}

@Composable
private fun Field(label: String, value: String, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value, onValueChange = onChange, label = { Text(label) }, singleLine = true,
        modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
    )
}
