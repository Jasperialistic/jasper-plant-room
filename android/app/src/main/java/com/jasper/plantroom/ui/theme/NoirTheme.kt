package com.jasper.plantroom.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Noir Édition tokens — mirrors docs/design/premium-direction.md (owner-accepted,
// frozen). Display serif stands in for Bodoni Moda until the licensed family is
// bundled; UI type is the platform sans (Inter on web).
object NoirColors {
    val Noir = Color(0xFF080808)
    val Espresso = Color(0xFF1C1915)
    val CardTop = Color(0xFF181512)
    val CardBottom = Color(0xFF100E0B)
    val Ivory = Color(0xFFF4F1EC)
    val Muted = Color(0xFF9A948A)
    val Champagne = Color(0xFFC9B18A)
    val ChampagneHi = Color(0xFFE7D6B4)
    val OnChampagne = Color(0xFF171108)
}

private val NoirScheme = darkColorScheme(
    primary = NoirColors.Champagne,
    onPrimary = NoirColors.OnChampagne,
    primaryContainer = NoirColors.Espresso,
    onPrimaryContainer = NoirColors.ChampagneHi,
    secondary = NoirColors.Champagne,
    onSecondary = NoirColors.OnChampagne,
    background = NoirColors.Noir,
    onBackground = NoirColors.Ivory,
    surface = NoirColors.CardTop,
    onSurface = NoirColors.Ivory,
    surfaceVariant = NoirColors.Espresso,
    onSurfaceVariant = NoirColors.Muted,
    outline = Color(0x1DF4F1EC),
    error = Color(0xFFC98B8B),
)

private val NoirType = Typography(
    displayLarge = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Medium, fontSize = 48.sp, letterSpacing = 0.sp),
    headlineMedium = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Medium, fontSize = 26.sp),
    titleLarge = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Medium, fontSize = 20.sp),
    titleMedium = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Medium, fontSize = 17.sp),
    labelLarge = TextStyle(fontWeight = FontWeight.Bold, fontSize = 12.sp, letterSpacing = 0.16.sp),
    labelMedium = TextStyle(fontWeight = FontWeight.Bold, fontSize = 10.sp, letterSpacing = 0.22.sp),
    bodyLarge = TextStyle(fontSize = 15.sp, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontSize = 13.sp, lineHeight = 19.sp),
)

@Composable
fun NoirTheme(content: @Composable () -> Unit) {
    // The product is intentionally warm-noir in all system modes (owner-frozen v1).
    isSystemInDarkTheme()
    MaterialTheme(colorScheme = NoirScheme, typography = NoirType, content = content)
}
