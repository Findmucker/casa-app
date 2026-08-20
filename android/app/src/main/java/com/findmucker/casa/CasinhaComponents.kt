package com.findmucker.casa

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.NumberFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

val CasinhaBackgroundBrush = Brush.linearGradient(
    listOf(
        CasinhaPalette.Rose50.copy(alpha = 0.82f),
        CasinhaPalette.Pink50,
        CasinhaPalette.Purple50.copy(alpha = 0.64f),
    ),
)

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    color: Color = Color.White.copy(alpha = 0.68f),
    borderColor: Color = CasinhaPalette.Pink100.copy(alpha = 0.72f),
    contentPadding: PaddingValues = PaddingValues(12.dp),
    content: @Composable () -> Unit,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = color,
        border = BorderStroke(1.dp, borderColor),
        shadowElevation = 0.dp,
    ) {
        Box(modifier = Modifier.padding(contentPadding)) { content() }
    }
}

@Composable
fun CasinhaProgress(
    progress: Float,
    color: Color,
    modifier: Modifier = Modifier,
    trackColor: Color = CasinhaPalette.Pink100.copy(alpha = 0.82f),
    height: Int = 6,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height.dp)
            .clip(CircleShape)
            .background(trackColor),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(progress.coerceIn(0f, 1f))
                .height(height.dp)
                .clip(CircleShape)
                .background(color),
        )
    }
}

@Composable
fun GradientActionButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    start: Color = CasinhaPalette.Pink400,
    end: Color = CasinhaPalette.Rose400,
) {
    val shape = RoundedCornerShape(16.dp)
    Button(
        onClick = onClick,
        modifier = modifier.background(Brush.horizontalGradient(listOf(start, end)), shape),
        enabled = enabled,
        shape = shape,
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            disabledContainerColor = Color.Transparent,
            contentColor = Color.White,
            disabledContentColor = Color.White.copy(alpha = 0.55f),
        ),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 11.dp),
    ) {
        Text(text, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
    }
}

@Composable
fun FeedbackBanner(error: String?, notice: String?, modifier: Modifier = Modifier) {
    val message = error ?: notice ?: return
    val isError = error != null
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = if (isError) CasinhaPalette.Rose100 else CasinhaPalette.Emerald100,
        border = BorderStroke(1.dp, if (isError) CasinhaPalette.Rose200 else CasinhaPalette.Emerald200),
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
            color = if (isError) CasinhaPalette.Rose700 else CasinhaPalette.Emerald700,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
        )
    }
}

@Composable
fun EmptyState(emoji: String, message: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxWidth().padding(vertical = 36.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(emoji, fontSize = 42.sp)
        Text(message, color = CasinhaPalette.Pink300, fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp))
    }
}

fun Double.asEuro(): String = NumberFormat.getCurrencyInstance(Locale("pt", "PT")).format(this)

fun todayKey(): String = LocalDate.now().format(DateTimeFormatter.ISO_DATE)

data class WeatherVisual(val emoji: String, val label: String)

fun weatherVisual(code: Int): WeatherVisual = when (code) {
    0 -> WeatherVisual("☀️", "Céu limpo")
    1 -> WeatherVisual("🌤️", "Quase limpo")
    2 -> WeatherVisual("⛅", "Parcialmente nublado")
    3 -> WeatherVisual("☁️", "Nublado")
    45, 48 -> WeatherVisual("🌫️", "Nevoeiro")
    in 51..57 -> WeatherVisual("🌦️", "Chuvisco")
    in 61..67 -> WeatherVisual("🌧️", "Chuva")
    in 71..77 -> WeatherVisual("🌨️", "Neve")
    in 80..82 -> WeatherVisual("🌦️", "Aguaceiros")
    in 85..86 -> WeatherVisual("🌨️", "Neve")
    in 95..99 -> WeatherVisual("⛈️", "Trovoada")
    else -> WeatherVisual("🌡️", "Desconhecido")
}
