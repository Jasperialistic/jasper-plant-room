package com.jasper.plantroom

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
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

private sealed interface ScreenState {
    data object Loading : ScreenState
    data object SignedOut : ScreenState
    data class Collection(val plants: List<Plant>) : ScreenState
    data class Failed(val message: String) : ScreenState
}

@Composable
fun PlantRoomApp() {
    var state by remember { mutableStateOf<ScreenState>(ScreenState.Loading) }
    val scope = rememberCoroutineScope()

    fun load() {
        state = ScreenState.Loading
        scope.launch {
            state = try {
                if (!PlantRepository.isAuthenticated) ScreenState.SignedOut
                else ScreenState.Collection(PlantRepository.loadPlants())
            } catch (error: Exception) {
                ScreenState.Failed(error.message ?: "Unknown error")
            }
        }
    }

    LaunchedEffect(Unit) { load() }

    when (val current = state) {
        ScreenState.Loading -> FullText("Loading collection…")
        ScreenState.SignedOut -> AuthScreen(onSignedIn = { load() })
        is ScreenState.Collection -> CollectionScreen(plants = current.plants)
        is ScreenState.Failed -> FailureScreen(message = current.message, onRetry = { load() })
    }
}

@Composable
private fun FullText(text: String) {
    BoxWithConstraints(Modifier.fillMaxSize().background(NoirColors.Noir), contentAlignment = Alignment.Center) {
        Text(text, color = NoirColors.Muted, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun AuthScreen(onSignedIn: () -> Unit) {
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
    }
}

@Composable
private fun CollectionScreen(plants: List<Plant>) {
    // Adaptive: two panes on the unfolded inner display, one on the Fold8 cover.
    BoxWithConstraints(Modifier.fillMaxSize().background(NoirColors.Noir)) {
        val expanded = maxWidth >= 840.dp
        Column(Modifier.fillMaxSize().padding(horizontal = if (expanded) 32.dp else 16.dp, vertical = 24.dp)) {
            Text("THE COLLECTION", style = MaterialTheme.typography.labelMedium, color = NoirColors.Champagne)
            Text(
                "${plants.size} specimens",
                style = MaterialTheme.typography.headlineMedium,
                color = NoirColors.Ivory,
            )
            Spacer(Modifier.height(16.dp))
            if (expanded) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    PlantList(plants, Modifier.weight(1f))
                    BoxWithConstraints(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        Text("Select a specimen", color = NoirColors.Muted, style = MaterialTheme.typography.bodyLarge)
                    }
                }
            } else {
                PlantList(plants, Modifier.fillMaxSize())
            }
        }
    }
}

@Composable
private fun PlantList(plants: List<Plant>, modifier: Modifier = Modifier) {
    LazyColumn(modifier = modifier, verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(plants, key = { it.id }) { plant ->
            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = NoirColors.CardTop),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            ) {
                Column(Modifier.fillMaxWidth().padding(16.dp)) {
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
