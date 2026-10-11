package com.jasper.plantroom

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jasper.plantroom.net.CareLogEntry
import com.jasper.plantroom.net.GrowZone
import com.jasper.plantroom.net.Plant
import com.jasper.plantroom.net.PlantRepository
import com.jasper.plantroom.ui.CareLogRow
import com.jasper.plantroom.ui.Chip
import com.jasper.plantroom.ui.EmptyState
import com.jasper.plantroom.ui.PlantPhotoCard
import com.jasper.plantroom.ui.PlantRules
import com.jasper.plantroom.ui.QueueRow
import com.jasper.plantroom.ui.StatTile
import com.jasper.plantroom.ui.statusLabel
import com.jasper.plantroom.ui.theme.NoirColors
import com.jasper.plantroom.ui.theme.NoirTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        PlantRepository.initialize(this) // enables the persistent owner session
        setContent {
            NoirTheme {
                PlantRoomApp()
            }
        }
    }
}

/**
 * Guren's Garden native shell: mirrors the mobile web app's structure and
 * functions (dashboard, plants, care log, locations, to-profile) one-to-one,
 * wearing the accepted Noir palette. Public visitors browse with anon RLS
 * reads; owner sign-in persists across launches and unlocks write actions.
 */
private sealed interface ScreenState {
    data object Loading : ScreenState
    data class Collection(
        val plants: List<Plant>,
        val owner: Boolean,
        val covers: Map<String, String?>,
        val careLog: List<CareLogEntry>,
        val zones: List<GrowZone>,
    ) : ScreenState
    data object SignIn : ScreenState
    data class Failed(val message: String) : ScreenState
}

private enum class Tab(val label: String) {
    Dashboard("Dashboard"), Plants("Plants"), CareLog("Care log"),
    Locations("Locations"), Profile("To profile")
}

@Composable
fun PlantRoomApp() {
    var state by remember { mutableStateOf<ScreenState>(ScreenState.Loading) }
    var openPlantId by rememberSaveable { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun load() {
        state = ScreenState.Loading
        scope.launch {
            state = try {
                val plants = PlantRepository.loadPlants()
                val cloud = PlantRepository.loadAllPhotos().groupBy { it.plantId }
                val base = PlantRepository.loadAllBasePhotos().groupBy { it.plantId }
                val covers = (cloud.keys + base.keys).associateWith { id ->
                    PlantRepository.coverUrl(cloud[id] ?: emptyList(), base[id] ?: emptyList())
                }
                // Care log / zones are supporting views: degrade softly on failure.
                val careLog = runCatching { PlantRepository.loadCareLog() }.getOrDefault(emptyList())
                val zones = runCatching { PlantRepository.loadGrowZones() }.getOrDefault(emptyList())
                ScreenState.Collection(plants, PlantRepository.isAuthenticated, covers, careLog, zones)
            } catch (error: Exception) {
                ScreenState.Failed(error.message ?: "Unknown error")
            }
        }
    }

    LaunchedEffect(Unit) { load() }

    val collection = state as? ScreenState.Collection
    val openPlant = collection?.plants?.firstOrNull { it.id == openPlantId }
    if (openPlant != null && collection != null) {
        // Native Back returns to the collection instead of finishing the activity.
        androidx.activity.compose.BackHandler { openPlantId = null }
        PlantDetailScreen(
            plant = openPlant,
            owner = collection.owner,
            onBack = { openPlantId = null },
        )
        return
    }

    when (val current = state) {
        ScreenState.Loading -> FullText("Loading the garden…")
        ScreenState.SignIn -> AuthScreen(
            onSignedIn = { load() },
            onCancel = { load() },
        )
        is ScreenState.Collection -> ShellScreen(
            plants = current.plants,
            covers = current.covers,
            careLog = current.careLog,
            zones = current.zones,
            owner = current.owner,
            onOpenPlant = { openPlantId = it },
            onOwnerSignIn = { state = ScreenState.SignIn },
            onRefresh = { load() },
        )
        is ScreenState.Failed -> FailureScreen(message = current.message, onRetry = { load() })
    }
}

@Composable
private fun FullText(text: String) {
    Box(Modifier.fillMaxSize().background(NoirColors.Noir), contentAlignment = Alignment.Center) {
        Text(text, color = NoirColors.Muted, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun ShellScreen(
    plants: List<Plant>,
    covers: Map<String, String?>,
    careLog: List<CareLogEntry>,
    zones: List<GrowZone>,
    owner: Boolean,
    onOpenPlant: (String) -> Unit,
    onOwnerSignIn: () -> Unit,
    onRefresh: () -> Unit,
) {
    var tab by rememberSaveable { mutableStateOf(Tab.Dashboard.name) }
    val current = Tab.valueOf(tab)
    var showAddPlant by rememberSaveable { mutableStateOf(false) }

    if (showAddPlant) {
        com.jasper.plantroom.ui.AddPlantSheet(onDismiss = { saved ->
            showAddPlant = false
            if (saved) onRefresh()
        })
    }

    BoxWithConstraints(Modifier.fillMaxSize().background(NoirColors.Noir)) {
        Column(Modifier.fillMaxSize()) {
            // ── topbar: Guren's Garden ─────────────────────────────────────
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Guren's Garden", color = NoirColors.Ivory, fontSize = 21.sp)
                    Text(
                        "collection · growth · care",
                        color = NoirColors.Muted, fontSize = 11.sp, letterSpacing = 1.2.sp
                    )
                }
                if (owner) {
                    TextButton(onClick = { showAddPlant = true }) {
                        Text("+ ADD PLANT", color = NoirColors.Champagne, fontSize = 11.5.sp, letterSpacing = 1.sp)
                    }
                }
                TextButton(onClick = onOwnerSignIn) {
                    Text(
                        if (owner) "OWNER" else "SIGN IN",
                        color = NoirColors.Champagne, fontSize = 11.5.sp, letterSpacing = 1.sp
                    )
                }
            }
            // ── tab row (web parity) ───────────────────────────────────────
            Row(
                Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Tab.entries.filter { it != Tab.CareLog || owner }.forEach { t ->
                    val active = t == current
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(
                                if (active) Brush.verticalGradient(
                                    listOf(NoirColors.Champagne, NoirColors.ChampagneHi)
                                ) else Brush.verticalGradient(
                                    listOf(NoirColors.CardTop, NoirColors.CardBottom)
                                )
                            )
                            .clickable { tab = t.name }
                            .padding(horizontal = 15.dp, vertical = 8.dp)
                    ) {
                        Text(
                            t.label,
                            color = if (active) NoirColors.OnChampagne else NoirColors.Muted,
                            fontSize = 12.5.sp
                        )
                    }
                }
            }
            Spacer(Modifier.height(10.dp))

            when (current) {
                Tab.Dashboard -> DashboardView(plants, covers, careLog, owner, onOpenPlant, Modifier.weight(1f))
                Tab.Plants -> PlantsView(plants, covers, onOpenPlant, Modifier.weight(1f))
                Tab.CareLog -> CareLogView(careLog, Modifier.weight(1f))
                Tab.Locations -> ZonesView(zones, plants, Modifier.weight(1f))
                Tab.Profile -> ProfileView(Modifier.weight(1f))
            }
        }
    }
}

/** Web dashboard mirror: hero, today card, stats, care queue, recent log. */
@Composable
private fun DashboardView(
    plants: List<Plant>,
    covers: Map<String, String?>,
    careLog: List<CareLogEntry>,
    owner: Boolean,
    onOpenPlant: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val ranked = plants.sortedByDescending { PlantRules.daysSince(it.lastCare) }
    val checkToday = plants.count { PlantRules.statusOf(it) == "check" }
    val due = plants.count { PlantRules.statusOf(it) == "due" }
    val reservoir = plants.count { PlantRules.statusOf(it) == "reservoir" }

    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Column(Modifier.padding(top = 8.dp, bottom = 4.dp)) {
                Text("Guren's Garden", color = NoirColors.Ivory, fontSize = 30.sp)
                Text(
                    "Plants train patience. Good things come to those who wait.",
                    color = NoirColors.Champagne, fontSize = 14.sp,
                    fontStyle = FontStyle.Italic, modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
        // today card
        item {
            val top = ranked.firstOrNull()
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
                    .padding(16.dp)
            ) {
                if (owner && top != null) {
                    Text("Check ${top.name}", color = NoirColors.Ivory, fontSize = 17.sp)
                    Text(
                        "${top.group ?: "Plant"} · ${PlantRules.daysSince(top.lastCare)} days",
                        color = NoirColors.ChampagneHi, fontSize = 12.5.sp
                    )
                    Text(
                        "Last ${PlantRules.daysSince(top.lastCare)} · ${top.location ?: "Unassigned"}",
                        color = NoirColors.Muted, fontSize = 12.sp
                    )
                } else {
                    Text("${plants.size} specimens profiled", color = NoirColors.Ivory, fontSize = 17.sp)
                    Text("The living collection.", color = NoirColors.Muted, fontSize = 12.5.sp)
                }
            }
        }
        // stats
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                if (owner) {
                    StatTile("Profiled", plants.size.toString(), Modifier.weight(1f))
                    StatTile("Check today", checkToday.toString(), Modifier.weight(1f))
                    StatTile("Due", due.toString(), Modifier.weight(1f))
                    StatTile("Reservoir", reservoir.toString(), Modifier.weight(1f))
                } else {
                    StatTile("Profiled", plants.size.toString(), Modifier.weight(1f))
                    StatTile("Groups", plants.mapNotNull { it.group }.distinct().size.toString(), Modifier.weight(1f))
                    StatTile("Zones", plants.mapNotNull { it.location }.distinct().size.toString(), Modifier.weight(1f))
                    StatTile("Growth", careLog.size.toString(), Modifier.weight(1f))
                }
            }
        }
        // care queue (owner: ranked; visitor: first 12 by name)
        item {
            Text(
                if (owner) "Care queue" else "The collection",
                color = NoirColors.Ivory, fontSize = 16.sp, modifier = Modifier.padding(top = 6.dp)
            )
        }
        val queue = if (owner) ranked else plants.sortedBy { it.name }.take(12)
        items(queue, key = { "q-${it.id}" }) { plant ->
            QueueRow(plant, covers[plant.id]) { onOpenPlant(plant.id) }
        }
        // recent care log (owner)
        if (owner && careLog.isNotEmpty()) {
            item {
                Text("Recent care", color = NoirColors.Ivory, fontSize = 16.sp, modifier = Modifier.padding(top = 6.dp))
            }
            items(careLog.take(5), key = { "c-${it.id ?: it.careDate}" }) { entry ->
                CareLogRow(
                    date = PlantRules.prettyDate(entry.careDate),
                    action = entry.action ?: "Care",
                    plant = entry.plantName ?: "—",
                    details = entry.details ?: "",
                    location = entry.location ?: "",
                )
            }
        }
    }
}

/** Web plant-card grid with search + status filters. */
@Composable
private fun PlantsView(
    plants: List<Plant>,
    covers: Map<String, String?>,
    onOpenPlant: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var filter by rememberSaveable { mutableStateOf("All") }
    val filters = listOf("All", "Check", "Medium", "Due", "Reservoir")

    val filtered = plants.filter { plant ->
        val matchesQuery = query.isBlank() ||
            plant.name.contains(query, true) ||
            (plant.group?.contains(query, true) == true) ||
            (plant.location?.contains(query, true) == true)
        val matchesFilter = filter == "All" || statusLabel(PlantRules.statusOf(plant)).startsWith(filter, true)
        matchesQuery && matchesFilter
    }

    BoxWithConstraints(modifier) {
        val columns = if (maxWidth >= 840.dp) 2 else 1
        LazyVerticalGrid(
            columns = GridCells.Fixed(columns),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item(span = { GridItemSpan(maxLineSpan) }) {
                Column {
                    OutlinedTextField(
                        value = query, onValueChange = { query = it },
                        label = { Text("Search name, group, zone") },
                        singleLine = true, modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(10.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.horizontalScroll(rememberScrollState())
                    ) {
                        filters.forEach { f ->
                            val active = f == filter
                            Box(
                                Modifier
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(
                                        if (active) Brush.verticalGradient(
                                            listOf(NoirColors.Champagne, NoirColors.ChampagneHi)
                                        ) else Brush.verticalGradient(
                                            listOf(NoirColors.CardTop, NoirColors.CardBottom)
                                        )
                                    )
                                    .clickable { filter = f }
                                    .padding(horizontal = 13.dp, vertical = 7.dp)
                            ) {
                                Text(
                                    f,
                                    color = if (active) NoirColors.OnChampagne else NoirColors.Muted,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                }
            }
            if (filtered.isEmpty()) {
                item(span = { GridItemSpan(maxLineSpan) }) {
                    EmptyState(if (plants.isEmpty()) "No plants in the collection yet." else "No plants match “$query”.")
                }
            } else {
                items(filtered, key = { it.id }) { plant ->
                    PlantPhotoCard(plant, covers[plant.id]) { onOpenPlant(plant.id) }
                }
            }
        }
    }
}

@Composable
private fun CareLogView(careLog: List<CareLogEntry>, modifier: Modifier = Modifier) {
    if (careLog.isEmpty()) {
        Box(modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
            EmptyState("No care entries yet.")
        }
        return
    }
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(careLog, key = { it.id ?: "${it.careDate}-${it.plantName}" }) { entry ->
            CareLogRow(
                date = PlantRules.prettyDate(entry.careDate),
                action = entry.action ?: "Care",
                plant = entry.plantName ?: "—",
                details = entry.details ?: "",
                location = entry.location ?: "",
            )
        }
    }
}

@Composable
private fun ZonesView(zones: List<GrowZone>, plants: List<Plant>, modifier: Modifier = Modifier) {
    if (zones.isEmpty()) {
        Box(modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
            EmptyState("No grow zones defined.")
        }
        return
    }
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(zones, key = { it.id ?: it.name }) { zone ->
            val count = plants.count { it.location == zone.name }
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
                    .padding(16.dp)
            ) {
                Text(zone.name, color = NoirColors.Ivory, fontSize = 16.sp)
                zone.details?.takeIf { it.isNotBlank() }?.let {
                    Text(it, color = NoirColors.Muted, fontSize = 12.5.sp, modifier = Modifier.padding(top = 4.dp))
                }
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    zone.humidity?.takeIf { it.isNotBlank() }?.let { Chip("RH $it") }
                    zone.par?.takeIf { it.isNotBlank() }?.let { Chip("PAR $it") }
                    zone.growLights?.takeIf { it.isNotBlank() }?.let { Chip(it) }
                    Chip("$count plants")
                }
            }
        }
    }
}

/** Web "To profile" view: backlog (currently empty in production). */
@Composable
private fun ProfileView(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
        EmptyState("Nothing waiting to be profiled.")
    }
}

@Composable
private fun AuthScreen(onSignedIn: () -> Unit, onCancel: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        Modifier.fillMaxSize().background(NoirColors.Noir).padding(28.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Guren's Garden", style = MaterialTheme.typography.displayLarge, color = NoirColors.Ivory)
        Text("OWNER SIGN IN", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
        Spacer(Modifier.height(28.dp))
        OutlinedTextField(
            value = email, onValueChange = { email = it }, label = { Text("Email") },
            singleLine = true, modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = password, onValueChange = { password = it }, label = { Text("Password") },
            singleLine = true, visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
        )
        error?.let {
            Spacer(Modifier.height(12.dp))
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
        }
        Spacer(Modifier.height(24.dp))
        Button(
            onClick = {
                busy = true; error = null
                scope.launch {
                    try {
                        PlantRepository.signIn(email.trim(), password)
                        onSignedIn()
                    } catch (e: Exception) {
                        error = e.message ?: "Sign in failed"
                    } finally {
                        busy = false
                    }
                }
            },
            enabled = !busy && email.isNotBlank() && password.isNotBlank(),
            shape = RoundedCornerShape(50),
            colors = ButtonDefaults.buttonColors(containerColor = NoirColors.Champagne, contentColor = NoirColors.OnChampagne),
            modifier = Modifier.fillMaxWidth().height(52.dp),
        ) { Text(if (busy) "SIGNING IN…" else "SIGN IN") }
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onCancel) { Text("CONTINUE AS VISITOR", color = NoirColors.Muted) }
    }
}

@Composable
private fun FailureScreen(message: String, onRetry: () -> Unit) {
    Column(
        Modifier.fillMaxSize().background(NoirColors.Noir).padding(28.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Something went wrong", style = MaterialTheme.typography.headlineMedium, color = NoirColors.Ivory)
        Spacer(Modifier.height(8.dp))
        Text(message, color = NoirColors.Muted, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.height(20.dp))
        OutlinedButton(onClick = onRetry, shape = RoundedCornerShape(50)) { Text("RETRY") }
    }
}
