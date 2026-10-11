package com.jasper.plantroom.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.jasper.plantroom.net.Plant
import com.jasper.plantroom.ui.theme.NoirColors

/**
 * Bottom app bar mirroring the web's #mobileAppNav (v47): Dashboard · Plants ·
 * ＋ quick add · Zones · More — same items, same order, one-hand reach.
 */
@Composable
fun BottomNavBar(
    active: String,
    onSelect: (String) -> Unit,
    onQuickAdd: () -> Unit,
    onMore: () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .background(NoirColors.CardBottom)
            .padding(top = 8.dp, bottom = 12.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        NavItem(Icons.Filled.Home, "Dashboard", active == "dashboard") { onSelect("dashboard") }
        NavItem(Icons.Filled.List, "Plants", active == "plants") { onSelect("plants") }
        // web #mobileNavAdd: raised centre accent
        Box(
            Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(Brush.verticalGradient(listOf(NoirColors.Champagne, NoirColors.ChampagneHi)))
                .clickable(onClick = onQuickAdd),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Filled.Add, "Quick add", tint = NoirColors.OnChampagne, modifier = Modifier.size(26.dp))
        }
        NavItem(Icons.Filled.Place, "Zones", active == "locations") { onSelect("locations") }
        NavItem(Icons.Filled.MoreVert, "More", active == "log" || active == "profile") { onMore() }
    }
}

@Composable
private fun NavItem(icon: ImageVector, label: String, active: Boolean, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Icon(
            icon, label,
            tint = if (active) NoirColors.Champagne else NoirColors.Muted,
            modifier = Modifier.size(22.dp),
        )
        Spacer(Modifier.height(3.dp))
        Text(
            label,
            color = if (active) NoirColors.Champagne else NoirColors.Muted,
            fontSize = 10.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

/** Web #mobileQuickActions sheet. */
@Composable
fun QuickActionSheet(
    owner: Boolean,
    onAddPlant: () -> Unit,
    onGrowthPhoto: () -> Unit,
    onCareEntry: () -> Unit,
    onSignIn: () -> Unit,
    onDismiss: () -> Unit,
) {
    SheetDialog(title = "Quick action", subtitle = "Owner shortcuts for the things you add most often.", onDismiss = onDismiss) {
        SheetAction("＋ Add Plant", "Create a new collection entry", accent = true) {
            onDismiss(); onAddPlant()
        }
        SheetAction("Growth Photo", "Choose a plant, then add a progress photo") {
            onDismiss(); if (owner) onGrowthPhoto() else onSignIn()
        }
        SheetAction("Care Entry", "Log watering, checks, repotting or custom care") {
            onDismiss(); if (owner) onCareEntry() else onSignIn()
        }
        SheetAction("Cancel", "", cancel = true, onClick = onDismiss)
    }
}

/** Web #mobileMoreSheet. */
@Composable
fun MoreSheet(
    owner: Boolean,
    onCareLog: () -> Unit,
    onToProfile: () -> Unit,
    onDismiss: () -> Unit,
) {
    SheetDialog(title = "More", subtitle = "Other Plant Room sections.", onDismiss = onDismiss) {
        if (owner) {
            SheetAction("Care log", "Full cloud-synced care history") {
                onDismiss(); onCareLog()
            }
        }
        SheetAction("To profile", "Plants still waiting for a full profile") {
            onDismiss(); onToProfile()
        }
        SheetAction("Cancel", "", cancel = true, onClick = onDismiss)
    }
}

/** Plant chooser feeding the web's growth/care quick flows. */
@Composable
fun PlantPickerSheet(plants: List<Plant>, title: String, onPick: (Plant) -> Unit, onDismiss: () -> Unit) {
    SheetDialog(title = title, subtitle = "Choose a plant.", onDismiss = onDismiss) {
        LazyColumn(Modifier.height(360.dp)) {
            items(plants, key = { it.id }) { plant ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .clickable { onDismiss(); onPick(plant) }
                        .padding(vertical = 12.dp, horizontal = 4.dp)
                ) {
                    Column {
                        Text(plant.name, color = NoirColors.Ivory, fontSize = 14.sp)
                        Text(
                            listOfNotNull(plant.group, plant.location).joinToString(" · ").ifBlank { "Specimen" },
                            color = NoirColors.Muted, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }
        SheetAction("Cancel", "", cancel = true, onClick = onDismiss)
    }
}

@Composable
private fun SheetDialog(title: String, subtitle: String, onDismiss: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false, dismissOnClickOutside = true),
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .padding(top = 220.dp)
                .clip(RoundedCornerShape(topStart = 22.dp, topEnd = 22.dp))
                .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
                .padding(horizontal = 18.dp, vertical = 18.dp)
        ) {
            Box(
                Modifier
                    .width(38.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(NoirColors.Muted.copy(alpha = 0.4f))
                    .align(Alignment.CenterHorizontally)
            )
            Spacer(Modifier.height(14.dp))
            Text(title, color = NoirColors.Ivory, fontWeight = FontWeight.SemiBold, fontSize = 17.sp)
            Text(subtitle, color = NoirColors.Muted, fontSize = 11.5.sp)
            Spacer(Modifier.height(14.dp))
            content()
        }
    }
}

@Composable
private fun SheetAction(label: String, sub: String, accent: Boolean = false, cancel: Boolean = false, onClick: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .padding(bottom = 7.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(
                when {
                    cancel -> NoirColors.CardBottom
                    accent -> Brush.verticalGradient(listOf(NoirColors.Champagne, NoirColors.ChampagneHi))
                    else -> Brush.verticalGradient(listOf(NoirColors.Espresso, NoirColors.CardBottom))
                }.let { if (it is Brush) it else Brush.verticalGradient(listOf(NoirColors.CardBottom, NoirColors.CardBottom)) }
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 13.dp)
    ) {
        Text(
            label,
            color = if (accent) NoirColors.OnChampagne else NoirColors.Ivory,
            fontSize = 14.5.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Start,
        )
        if (sub.isNotBlank()) {
            Text(sub, color = if (accent) NoirColors.OnChampagne.copy(alpha = 0.75f) else NoirColors.Muted, fontSize = 11.sp)
        }
    }
}
