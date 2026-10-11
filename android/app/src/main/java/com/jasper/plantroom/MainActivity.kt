package com.jasper.plantroom

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.jasper.plantroom.net.Plant
import com.jasper.plantroom.net.PlantRepository
import com.jasper.plantroom.ui.theme.NoirColors
import com.jasper.plantroom.ui.theme.NoirTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NoirTheme {
                PlantRoomApp()
            }
        }
    }
}

/**
 * Public visitors browse the collection with anon RLS reads (same contract as
 * the web app). Owner sign-in unlocks write actions. Navigation is state-based
 * with saveable state so fold/unfold recreation preserves the open plant.
 */
private sealed interface ScreenState {
    data object Loading : ScreenState
    data class Collection(val plants: List<Plant>, val owner: Boolean, val covers: Map<String, String?>) : ScreenState
    data object SignIn : ScreenState
    data class Failed(val message: String) : ScreenState
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
                ScreenState.Collection(plants, PlantRepository.isAuthenticated, covers)
            } catch (error: Exception) {
                ScreenState.Failed(error.message ?: "Unknown error")
            }
        }
    }

    LaunchedEffect(Unit) { load() }

    val openPlant = (state as? ScreenState.Collection)?.plants?.firstOrNull { it.id == openPlantId }
    if (openPlant != null) {
        // Native Back returns to the collection instead of finishing the activity.
        androidx.activity.compose.BackHandler { openPlantId = null }
        PlantDetailScreen(
            plant = openPlant,
            owner = (state as? ScreenState.Collection)?.owner == true,
            onBack = { openPlantId = null },
        )
        return
    }

    when (val current = state) {
        ScreenState.Loading -> FullText("Loading collection…")
        ScreenState.SignIn -> AuthScreen(
            onSignedIn = { load() },
            onCancel = { load() },
        )
        is ScreenState.Collection -> CollectionScreen(
            plants = current.plants,
            covers = current.covers,
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
        Text("Plant Room", style = MaterialTheme.typography.displayLarge, color = NoirColors.Ivory)
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
private fun CollectionScreen(
    plants: List<Plant>,
    covers: Map<String, String?>,
    owner: Boolean,
    onOpenPlant: (String) -> Unit,
    onOwnerSignIn: () -> Unit,
    onRefresh: () -> Unit,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var showAddPlant by rememberSaveable { mutableStateOf(false) }
    val filtered = plants.filter {
        query.isBlank() || it.name.contains(query, ignoreCase = true) ||
            (it.group?.contains(query, ignoreCase = true) == true) ||
            (it.location?.contains(query, ignoreCase = true) == true)
    }
    if (showAddPlant) {
        com.jasper.plantroom.ui.AddPlantSheet(onDismiss = { saved ->
            showAddPlant = false
            if (saved) onRefresh()
        })
    }

    // Adaptive: two panes on the unfolded inner display, one on the Fold8 cover.
    BoxWithConstraints(Modifier.fillMaxSize().background(NoirColors.Noir)) {
        val expanded = maxWidth >= 840.dp
        Column(Modifier.fillMaxSize().padding(horizontal = if (expanded) 32.dp else 16.dp, vertical = 24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("THE COLLECTION", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
                    Text(
                        "${plants.size} specimens",
                        style = MaterialTheme.typography.headlineMedium,
                        color = NoirColors.Ivory,
                    )
                }
                if (owner) {
                    TextButton(onClick = { showAddPlant = true }) {
                        Text("ADD PLANT", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
                    }
                }
                TextButton(onClick = onOwnerSignIn) {
                    Text(if (owner) "OWNER" else "OWNER SIGN IN", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
                }
            }
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = query, onValueChange = { query = it },
                label = { Text("Search name, group, zone") },
                singleLine = true, modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))
            if (filtered.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        if (plants.isEmpty()) "No plants in the collection yet." else "No plants match “$query”.",
                        color = NoirColors.Muted, style = MaterialTheme.typography.bodyLarge,
                    )
                }
            } else if (expanded) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    PlantList(filtered, covers, onOpenPlant, Modifier.weight(1f))
                    Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        Text("Select a specimen", color = NoirColors.Muted, style = MaterialTheme.typography.bodyLarge)
                    }
                }
            } else {
                PlantList(filtered, covers, onOpenPlant, Modifier.fillMaxSize())
            }
        }
    }
}

@Composable
private fun PlantList(
    plants: List<Plant>,
    covers: Map<String, String?>,
    onOpenPlant: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyColumn(modifier = modifier, verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(plants, key = { it.id }) { plant ->
            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = NoirColors.CardTop),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                modifier = Modifier.clickable { onOpenPlant(plant.id) },
            ) {
                Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    val cover = covers[plant.id]
                    if (cover != null) {
                        AsyncImage(
                            model = cover,
                            contentDescription = plant.name,
                            contentScale = ContentScale.Crop,
                            // Thumbnails at tile size; originals load only on demand.
                            modifier = Modifier.width(64.dp).height(72.dp).clip(RoundedCornerShape(14.dp)),
                        )
                        Spacer(Modifier.width(14.dp))
                    }
                    Column {
                        Text(plant.name, style = MaterialTheme.typography.titleMedium, color = NoirColors.Ivory)
                        Text(
                            listOfNotNull(plant.group, plant.location).joinToString(" · ").ifBlank { "Specimen" },
                            style = MaterialTheme.typography.labelMedium,
                            color = NoirColors.ChampagneHi,
                        )
                    }
                }
            }
        }
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
