package com.findmucker.casa

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val CasinhaColors = lightColorScheme(
    primary = Color(0xFFB72F66),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFFFD9E5),
    onPrimaryContainer = Color(0xFF3E001D),
    secondary = Color(0xFF725763),
    background = Color(0xFFFFF8FA),
    onBackground = Color(0xFF211A1D),
    surface = Color(0xFFFFF8FA),
    surfaceVariant = Color(0xFFF2DDE3),
    onSurfaceVariant = Color(0xFF514349),
)

@Composable
fun CasinhaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = CasinhaColors,
        content = content,
    )
}
