package com.jasper.plantroom

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
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
import com.jasper.plantroom.ui.BottomNavBar
import com.jasper.plantroom.ui.MoreSheet
import com.jasper.plantroom.ui.PlantPhotoCard
import com.jasper.plantroom.ui.PlantPickerSheet
import com.jasper.plantroom.ui.PlantTileTarget
import com.jasper.plantroom.ui.QuickActionSheet
import com.jasper.plantroom.ui.plantTileTarget
import com.jasper.plantroom.ui.PlantRules
import com.jasper.plantroom.ui.QueueRow
import com.jasper.plantroom.ui.SquareTile
import com.jasper.plantroom.ui.StatTile
import com.jasper.plantroom.ui.theme.NoirColors
import com.jasper.plantroom.ui.theme.NoirTheme
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

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
 * Guren's Garden native app — a literal native mirror of the mobile website:
 * hero + today card above the same tab row, same dashboard (stats, Collection
 * highlights queue with due dates, Latest care), same plant-card grid. Only
 * the platform is native (for widgets, share targets and Fold8 integration).
 */
private sealed interface ScreenState {
    data object Loading : ScreenState
    data class Collection(
        val plants: List<Plant>,
        val owner: Boolean,
        val covers: Map<String, String?>,
        val careLog: List<CareLogEntry>,
        val zones: List<GrowZone>,
        val galleryCount: Int,
        val growthCount: Int,
        val growthLatest: String?,
    ) : ScreenState
    data object SignIn : ScreenState
    data class Failed(val message: String) : ScreenState
}

private enum class Tab(val label: String) {
    Dashboard("Dashboard"), Plants("Plants"), AddPlant("+ Add Plant"),
    CareLog("Care log"), Locations("Locations"), Profile("To profile")
}

@Composable
fun PlantRoomApp() {
    var state by remember { mutableStateOf<ScreenState>(ScreenState.Loading) }
    var openPlantId by rememberSaveable { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun load(silent: Boolean = false) {
        if (!silent) state = ScreenState.Loading
        scope.launch {
            state = try {
                val plants = PlantRepository.loadPlants()
                val photos = PlantRepository.loadAllPhotos()
                val cloud = photos.groupBy { it.plantId }
                val base = PlantRepository.loadAllBasePhotos().groupBy { it.plantId }
                val covers = (cloud.keys + base.keys).associateWith { id ->
                    PlantRepository.coverUrl(cloud[id] ?: emptyList(), base[id] ?: emptyList())
                }
                val careLog = runCatching { PlantRepository.loadCareLog() }.getOrDefault(emptyList())
                val zones = runCatching { PlantRepository.loadGrowZones() }.getOrDefault(emptyList())
                ScreenState.Collection(
                    plants, PlantRepository.isAuthenticated, covers, careLog, zones,
                    photos.count { it.kind == "gallery" }, photos.count { it.kind == "growth" },
                    photos.filter { it.kind == "growth" }.mapNotNull { it.photoDate }.maxOrNull(),
                )
            } catch (error: Exception) {
                ScreenState.Failed(error.message ?: "Unknown error")
            }
        }
    }

    LaunchedEffect(Unit) { load() }

    val collection = state as? ScreenState.Collection
    val openPlant = collection?.plants?.firstOrNull { it.id == openPlantId }
    if (openPlant != null && collection != null) {
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
        ScreenState.SignIn -> AuthScreen(onSignedIn = { load() }, onCancel = { load() })
        is ScreenState.Collection -> ShellScreen(
            plants = current.plants,
            covers = current.covers,
            careLog = current.careLog,
            zones = current.zones,
            galleryCount = current.galleryCount,
            growthCount = current.growthCount,
            growthLatest = current.growthLatest,
            owner = current.owner,
            onOpenPlant = { openPlantId = it },
            onOwnerSignIn = { state = ScreenState.SignIn },
            onRefresh = { load(silent = true) },
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

/** web renderGrowthUpdateAge() (v47:870): "Last growth update · Today/Yesterday/N days ago". */
private fun growthAgeText(latest: String?): String {
    if (latest.isNullOrBlank()) return "No growth photos yet"
    val days = runCatching {
        java.time.temporal.ChronoUnit.DAYS.between(
            java.time.LocalDate.parse(latest.take(10)), LocalDate.now()
        )
    }.getOrDefault(0L).coerceAtLeast(0)
    val age = when (days) {
        0L -> "Today"
        1L -> "Yesterday"
        else -> "$days days ago"
    }
    return "Last growth update · $age"
}

/** web saveCustomLog(): "Checked — still moist" -> next check +1 day. */
private fun moistNext(): String = LocalDate.now().plusDays(1).toString()

/** web saveCustomLog(): "Watered" -> next check + checkDays (null without). */
private fun wateredNext(plant: Plant): String? =
    plant.checkDays?.let { LocalDate.now().plusDays(it.toLong()).toString() }

@Composable
private fun ShellScreen(
    plants: List<Plant>,
    covers: Map<String, String?>,
    careLog: List<CareLogEntry>,
    zones: List<GrowZone>,
    galleryCount: Int,
    growthCount: Int,
    growthLatest: String?,
    owner: Boolean,
    onOpenPlant: (String) -> Unit,
    onOwnerSignIn: () -> Unit,
    onRefresh: () -> Unit,
) {
    var tab by rememberSaveable { mutableStateOf(Tab.Dashboard.name) }
    val current = Tab.valueOf(tab)
    var showAddPlant by rememberSaveable { mutableStateOf(false) }
    var showQuick by remember { mutableStateOf(false) }
    var showMore by remember { mutableStateOf(false) }
    var pickGrowth by remember { mutableStateOf(false) }
    var pickCare by remember { mutableStateOf(false) }
    var speciesFilter by rememberSaveable { mutableStateOf("") }
    var growthPlant by remember { mutableStateOf<Plant?>(null) }
    var carePlant by remember { mutableStateOf<Plant?>(null) }
    var careInFlight by remember { mutableStateOf(emptySet<String>()) }
    val scope = rememberCoroutineScope()
    val appCtx = androidx.compose.ui.platform.LocalContext.current

    // web addCare(): care_log insert + plants update, then refresh
    val quickCare: (Plant, String, String?) -> Unit = { plant, action, next ->
        if (plant.id !in careInFlight) scope.launch {
            careInFlight = careInFlight + plant.id
            try {
            val result = runCatching { PlantRepository.logCare(plant, action, "", next) }
            if (result.exceptionOrNull() is kotlinx.coroutines.CancellationException) throw result.exceptionOrNull()!!
            if (result.isSuccess) {
                android.util.Log.d("QuickCare", "logged '$action' for ${plant.name} next=$next")
                android.widget.Toast.makeText(appCtx, "${plant.name}: $action logged", android.widget.Toast.LENGTH_SHORT).show()
            } else {
                android.util.Log.e("QuickCare", "logCare failed for ${plant.name}", result.exceptionOrNull())
                android.widget.Toast.makeText(appCtx, "Care log failed: ${result.exceptionOrNull()?.message ?: "unknown"}", android.widget.Toast.LENGTH_LONG).show()
            }
            if (result.isSuccess) onRefresh()
            } finally { careInFlight = careInFlight - plant.id }
        }
    }

    if (showAddPlant) {
        com.jasper.plantroom.ui.AddPlantSheet(onDismiss = { saved ->
            showAddPlant = false
            if (saved) onRefresh()
        })
    }

    Box(Modifier.fillMaxSize().background(NoirColors.Noir)) {
        // web body::before: hero crystallinum leaf wallpaper at .38 (pre-blurred PNG)
        Image(
            painterResource(R.drawable.pr_wallpaper), null,
            contentScale = ContentScale.Crop, alpha = 0.38f,
            modifier = Modifier.fillMaxSize()
        )
        Column(Modifier.fillMaxSize()) {
        // clean top edge: brand lives in the hero below; account entry = leaf icon
        Row(
            Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 20.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Spacer(Modifier.weight(1f))
            Box(
                Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
                    .clickable(onClick = onOwnerSignIn),
                contentAlignment = Alignment.Center,
            ) {
                Image(painterResource(R.drawable.pr_leaf), "Account", modifier = Modifier.size(30.dp))
            }
        }

        // ── hero (web .hero): copy + today card, above the tabs ───────────
        Box(Modifier.fillMaxWidth()) {
        Image(
            painterResource(R.drawable.pr_header), null,
            contentScale = ContentScale.Crop, alpha = 0.6f,
            modifier = Modifier.matchParentSize().clip(RoundedCornerShape(16.dp))
        )
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Box {
                    Text(
                        "Guren's Garden",
                        color = Color(0x59000000), fontSize = 33.sp, fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(top = 3.dp)
                    )
                    Text(
                        "Guren's Garden",
                        fontSize = 33.sp, fontWeight = FontWeight.Medium,
                        style = TextStyle(
                            fontFamily = com.jasper.plantroom.ui.theme.PrBodoni,
                            brush = Brush.linearGradient(
                                listOf(NoirColors.ChampagneHi, NoirColors.Ivory, NoirColors.Champagne)
                            )
                        )
                    )
                }
                Text(
                    "Plants train patience. Good things come to those who wait.",
                    color = NoirColors.Champagne, fontSize = 15.sp,
                    fontFamily = com.jasper.plantroom.ui.theme.PrParisienne,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
            Spacer(Modifier.width(12.dp))
            // web .today-card: "Today" + weekday date + collection snapshot
            Column(
                Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom)))
                    .padding(12.dp)
            ) {
                Text("TODAY", color = NoirColors.Champagne, fontSize = 9.5.sp, letterSpacing = 1.2.sp)
                Spacer(Modifier.height(3.dp))
                Text(
                    LocalDate.now().format(DateTimeFormatter.ofPattern("EEE, d MMM")),
                    color = NoirColors.Ivory,
                    fontFamily = com.jasper.plantroom.ui.theme.PrBodoni,
                    fontSize = 13.5.sp
                )
                Text(growthAgeText(growthLatest), color = NoirColors.Muted, fontSize = 9.5.sp)
            }
        }
        }

        when (current) {
            Tab.Dashboard -> DashboardView(plants, covers, careLog, galleryCount, growthCount, owner, onOpenPlant, quickCare, careInFlight, onSpecies = { speciesFilter = it; tab = Tab.Plants.name }, onCustomCare = { carePlant = it }, modifier = Modifier.weight(1f))
            Tab.Plants -> PlantsView(plants, covers, owner, speciesFilter, { speciesFilter = "" }, onOpenPlant, Modifier.weight(1f))
            Tab.CareLog -> CareLogView(careLog, Modifier.weight(1f))
            Tab.Locations -> ZonesView(zones, plants, Modifier.weight(1f))
            Tab.Profile -> ProfileView(Modifier.weight(1f))
            Tab.AddPlant -> DashboardView(plants, covers, careLog, galleryCount, growthCount, owner, onOpenPlant, quickCare, careInFlight, onSpecies = { speciesFilter = it; tab = Tab.Plants.name }, onCustomCare = { carePlant = it }, modifier = Modifier.weight(1f))
        }

            // web #mobileAppNav: bottom app bar
            BottomNavBar(
                active = when (current) {
                    Tab.Dashboard -> "dashboard"
                    Tab.Plants -> "plants"
                    Tab.Locations -> "locations"
                    Tab.CareLog -> "log"
                    Tab.Profile -> "profile"
                    Tab.AddPlant -> "plants"
                },
                onSelect = { key ->
                    tab = when (key) {
                        "dashboard" -> Tab.Dashboard.name
                        "plants" -> Tab.Plants.name
                        else -> Tab.Locations.name
                    }
                },
                onQuickAdd = { showQuick = true },
                onMore = { showMore = true },
            )
        }

        if (showQuick) {
            QuickActionSheet(
                owner = owner,
                onAddPlant = { showAddPlant = true },
                onGrowthPhoto = { pickGrowth = true },
                onCareEntry = { pickCare = true },
                onSignIn = onOwnerSignIn,
                onDismiss = { showQuick = false },
            )
        }
        if (showMore) {
            MoreSheet(
                owner = owner,
                onCareLog = { tab = Tab.CareLog.name },
                onToProfile = { tab = Tab.Profile.name },
                onDismiss = { showMore = false },
            )
        }
        if (pickGrowth) {
            PlantPickerSheet(plants, "Growth Photo", onPick = { growthPlant = it }, onDismiss = { pickGrowth = false })
        }
        if (pickCare) {
            PlantPickerSheet(plants, "Care Entry", onPick = { carePlant = it }, onDismiss = { pickCare = false })
        }
        growthPlant?.let { p ->
            com.jasper.plantroom.ui.GrowthUploadSheet(
                plantId = p.id, plantName = p.name,
                onDismiss = { refreshed -> growthPlant = null; if (refreshed) onRefresh() },
            )
        }
        carePlant?.let { p ->
            com.jasper.plantroom.ui.CareLogSheet(
                plant = p,
                onDismiss = { saved -> carePlant = null; if (saved) onRefresh() },
            )
        }
    }
}

/** Web #dashboardView: stats + Collection highlights queue + Latest care. */
@Composable
private fun DashboardView(
    plants: List<Plant>,
    covers: Map<String, String?>,
    careLog: List<CareLogEntry>,
    galleryCount: Int,
    growthCount: Int,
    owner: Boolean,
    onOpenPlant: (String) -> Unit,
    onQuickCare: (Plant, String, String?) -> Unit = { _, _, _ -> },
    careInFlight: Set<String> = emptySet(),
    onSpecies: (String) -> Unit = {},
    onCustomCare: (Plant) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var showAll by remember { mutableStateOf(false) }
    // web renderQueue rank: overdue > today > upcoming; then earliest nextCheck
    val rank = mapOf("overdue" to 0, "today" to 1, "upcoming" to 2, "reservoir" to 3, "none" to 4)
    val queue = if (owner) {
        plants.filter { PlantRules.statusOf(it) in setOf("overdue", "today", "upcoming") }
            .sortedWith(compareBy({ rank[PlantRules.statusOf(it)] ?: 9 }, { it.nextCheck ?: "9999" }))
            .take(12)
    } else {
        plants.sortedBy { it.name }.take(12)
    }
    val checkToday = plants.count { PlantRules.statusOf(it) == "today" }
    val overdue = plants.count { PlantRules.statusOf(it) == "overdue" }
    val reservoir = plants.count { PlantRules.statusOf(it) == "reservoir" }

    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // stats (web renderStats + .stats breakpoints: 4 cols, 2x2 at <=900px)
        item {
            BoxWithConstraints(Modifier.fillMaxWidth()) {
                val gap = if (maxWidth < 620.dp) 8.dp else 14.dp
                val tiles = if (owner) listOf(
                    Triple("Plants profiled", plants.size.toString(), NoirColors.Ivory),
                    Triple("Check today", checkToday.toString(), NoirColors.ChampagneHi),
                    Triple("Overdue", overdue.toString(), Color(0xFFE8C8B5)),
                    Triple("Reservoir plants", reservoir.toString(), NoirColors.Ivory),
                ) else listOf(
                    Triple("Plants profiled", plants.size.toString(), NoirColors.Ivory),
                    Triple("Plant groups", plants.mapNotNull { it.group }.distinct().size.toString(), NoirColors.Ivory),
                    Triple("Gallery photos", galleryCount.toString(), NoirColors.Ivory),
                    Triple("Growth photos", growthCount.toString(), NoirColors.Ivory),
                )
                val rows = if (maxWidth < 900.dp) tiles.chunked(2) else listOf(tiles)
                Column(verticalArrangement = Arrangement.spacedBy(gap)) {
                    rows.forEach { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(gap), modifier = Modifier.fillMaxWidth()) {
                            row.forEach { (l, v, t) -> StatTile(l, v, t, Modifier.weight(1f)) }
                        }
                    }
                }
            }
        }
        // web #v414SpeciesStats: collection by plant group (tap = Plants filtered)
        item {
            com.jasper.plantroom.ui.SpeciesStrip(plants, onSpecies)
        }
        // section-head: COLLECTION / Collection highlights / Show all plants
        item {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 8.dp)) {
                Column(Modifier.weight(1f)) {
                    Text("COLLECTION", color = NoirColors.Champagne, fontSize = 9.5.sp, letterSpacing = 1.6.sp)
                    Text(
                        "Collection highlights", color = NoirColors.Ivory, fontSize = 18.sp,
                        fontFamily = com.jasper.plantroom.ui.theme.PrBodoni,
                    )
                }
                OutlinedButton(onClick = { showAll = true }) { Text("SHOW ALL PLANTS", fontSize = 10.5.sp, letterSpacing = 1.sp) }
            }
        }
        if (queue.isEmpty()) {
            item { EmptyState("Nothing currently has a dated check.") }
        }
        items(queue, key = { "q-${it.id}" }) { plant ->
            QueueRow(
                plant, covers[plant.id], owner,
                careBusy = plant.id in careInFlight,
                onMoist = { onQuickCare(plant, "Checked — still moist", moistNext()) },
                onWatered = { onQuickCare(plant, "Watered", wateredNext(plant)) },
                onReservoir = { onQuickCare(plant, "Reservoir topped up", null) },
                onCustom = { onCustomCare(plant) },
            ) { onOpenPlant(plant.id) }
        }
        // owner: RECENT / Latest care
        if (owner && careLog.isNotEmpty()) {
            item {
                Column(Modifier.padding(top = 8.dp)) {
                    Text("RECENT", color = NoirColors.Champagne, fontSize = 9.5.sp, letterSpacing = 1.6.sp)
                    Text(
                        "Latest care", color = NoirColors.Ivory, fontSize = 18.sp,
                        fontFamily = com.jasper.plantroom.ui.theme.PrBodoni,
                    )
                }
            }
            items(careLog.take(10), key = { "c-${it.id ?: it.careDate}" }) { entry ->
                CareLogRow(
                    date = PlantRules.prettyDate(entry.careDate),
                    plant = entry.plantName ?: "—",
                    action = entry.action ?: "Care",
                    details = entry.details ?: "",
                    location = entry.location ?: "",
                )
            }
        }
    }
    if (showAll) {
        // web "Show all plants" jumps to the Plants view; here it is a callback
        LaunchedEffect(showAll) { showAll = false }
    }
}

/** Web #plantsView: toolbar (search + group/location/status filters) + plant grid. */
@Composable
private fun PlantsView(
    plants: List<Plant>,
    covers: Map<String, String?>,
    owner: Boolean,
    species: String,
    onClearSpecies: () -> Unit,
    onOpenPlant: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var group by rememberSaveable { mutableStateOf("") }
    var location by rememberSaveable { mutableStateOf("") }
    var statusFilter by rememberSaveable { mutableStateOf("") }
    var gridMode by rememberSaveable { mutableStateOf(PlantRepository.getGridMode()) } // Cards ⇄ Instagram grid (persisted)

    val groups = listOf("") + plants.mapNotNull { it.group }.filter { it.isNotBlank() }.distinct().sorted()
    val locations = listOf("") + plants.mapNotNull { it.location }.filter { it.isNotBlank() }.distinct().sorted()

    val filtered = plants.filter { plant ->
        val hay = listOfNotNull(
            plant.name, plant.group, plant.location, plant.medium, plant.pot, plant.potType, plant.outerPot
        ).joinToString(" ").lowercase()
        if (query.isNotBlank() && !hay.contains(query.lowercase())) return@filter false
        if (group.isNotBlank() && plant.group != group) return@filter false
        if (location.isNotBlank() && plant.location != location) return@filter false
        if (species.isNotEmpty() && com.jasper.plantroom.ui.speciesOf(plant) != species) return@filter false
        val st = PlantRules.statusOf(plant)
        when (statusFilter) {
            "Due / overdue" -> if (st !in setOf("today", "overdue")) return@filter false
            "Upcoming" -> if (st != "upcoming") return@filter false
            "Reservoir" -> if (st != "reservoir") return@filter false
        }
        true
    }

    BoxWithConstraints(modifier) {
        // web .plant-grid breakpoints: 3 cols desktop, 2 at <=900px, 1 at <=620px
        val columns = when {
            maxWidth >= 900.dp -> 3
            maxWidth >= 620.dp -> 2
            else -> 1
        }
        LazyVerticalGrid(
            columns = if (gridMode) GridCells.Fixed(3) else GridCells.Fixed(columns),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(if (gridMode) 2.dp else 12.dp),
            horizontalArrangement = Arrangement.spacedBy(if (gridMode) 2.dp else 12.dp),
        ) {
            item(span = { GridItemSpan(maxLineSpan) }) {
                Column {
                    OutlinedTextField(
                        value = query, onValueChange = { query = it },
                        placeholder = { Text("Search plant, shelf, medium…") },
                        singleLine = true, modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterSelect("All groups", groups.map { if (it.isEmpty()) "All groups" else it }, if (group.isEmpty()) "All groups" else group) {
                            onClearSpecies()
                            group = if (it == "All groups") "" else it
                        }
                        FilterSelect("All locations", locations.map { if (it.isEmpty()) "All locations" else it }, if (location.isEmpty()) "All locations" else location) {
                            location = if (it == "All locations") "" else it
                        }
                        if (owner) {
                            FilterSelect(
                                "All statuses",
                                listOf("All statuses", "Due / overdue", "Upcoming", "Reservoir"),
                                statusFilter.ifBlank { "All statuses" }
                            ) {
                                statusFilter = if (it == "All statuses") "" else it
                            }
                        }
                        // view switcher: web cards ⇄ Instagram-style square grid
                        listOf(false to "Cards", true to "Grid").forEach { (mode, label) ->
                            val active = mode == gridMode
                            Box(
                                Modifier
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(
                                        if (active) Brush.verticalGradient(listOf(NoirColors.Champagne, NoirColors.ChampagneHi))
                                        else Brush.verticalGradient(listOf(NoirColors.CardTop, NoirColors.CardBottom))
                                    )
                                    .clickable {
                                        gridMode = mode
                                        PlantRepository.setGridMode(mode)
                                    }
                                    .padding(horizontal = 13.dp, vertical = 7.dp)
                            ) {
                                Text(
                                    label,
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
                    EmptyState(if (plants.isEmpty()) "No plants in the collection yet." else "No plants match these filters.")
                }
            } else if (gridMode) {
                items(filtered, key = { it.id }) { plant ->
                    SquareTile(plant, covers[plant.id]) {
                        when (val target = plantTileTarget(gridMode, plant)) {
                            is PlantTileTarget.Detail -> onOpenPlant(target.plantId)
                        }
                    }
                }
            } else {
                items(filtered, key = { it.id }) { plant ->
                    PlantPhotoCard(plant, covers[plant.id], owner) { onOpenPlant(plant.id) }
                }
            }
        }
    }
}

/** Web <select> equivalent. */
@Composable
private fun FilterSelect(current: String, options: List<String>, selected: String, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(onClick = { expanded = true }, shape = RoundedCornerShape(50)) {
            Text(selected, fontSize = 11.5.sp, maxLines = 1)
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { option ->
                DropdownMenuItem(text = { Text(option) }, onClick = {
                    onSelect(option); expanded = false
                })
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
                plant = entry.plantName ?: "—",
                action = entry.action ?: "Care",
                details = entry.details ?: "",
                location = entry.location ?: "",
            )
        }
    }
}

/** Web #locationCards. */
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
                Text(zone.icon?.takeIf { it.isNotBlank() } ?: "◇", color = NoirColors.Champagne, fontSize = 18.sp)
                Text(zone.name, color = NoirColors.Ivory, fontSize = 16.sp)
                zone.details?.takeIf { it.isNotBlank() }?.let {
                    Text(it, color = NoirColors.Muted, fontSize = 12.5.sp, modifier = Modifier.padding(top = 4.dp))
                }
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    zone.humidity?.takeIf { it.isNotBlank() }?.let { Chip("Humidity $it") }
                    zone.par?.takeIf { it.isNotBlank() }?.let { Chip("PAR $it") }
                }
                zone.growLights?.takeIf { it.isNotBlank() }?.let {
                    Text("Grow lights: $it", color = NoirColors.Muted, fontSize = 11.5.sp, modifier = Modifier.padding(top = 8.dp))
                }
                zone.notes?.takeIf { it.isNotBlank() }?.let {
                    Text(it, color = NoirColors.Muted, fontSize = 11.5.sp, modifier = Modifier.padding(top = 4.dp))
                }
                Text(
                    "$count profiled plant${if (count == 1) "" else "s"} · click to view",
                    color = NoirColors.Muted, fontSize = 10.5.sp, modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }
}

/** Web #backlogView ("To profile"). */
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
