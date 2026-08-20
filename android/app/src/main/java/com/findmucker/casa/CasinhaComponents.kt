package com.findmucker.casa

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.NumberFormat
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.util.Locale

val CasinhaBackgroundBrush = Brush.linearGradient(
    listOf(
        CasinhaPalette.Rose50.copy(alpha = 0.82f),
        CasinhaPalette.Pink50,
        CasinhaPalette.Purple50.copy(alpha = 0.64f),
    ),
)

private val CasinhaDisplayDateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
private val CasinhaTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

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
fun CasinhaInput(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
) {
    val normalizedPlaceholder = placeholder.lowercase(Locale.ROOT)
    val isDate = "aaaa-mm-dd" in normalizedPlaceholder || "yyyy-mm-dd" in normalizedPlaceholder
    val isBirthDate = isDate && ("nascimento" in normalizedPlaceholder || "birth" in normalizedPlaceholder)
    val isTime = "hh:mm" in normalizedPlaceholder

    when {
        isDate -> CasinhaDateInput(
            value = value,
            onValueChange = onValueChange,
            placeholder = placeholder
                .replace(" (AAAA-MM-DD)", "")
                .replace(" (YYYY-MM-DD)", "")
                .replace("AAAA-MM-DD", "Data")
                .replace("YYYY-MM-DD", "Date"),
            modifier = modifier,
            allowFuture = !isBirthDate,
        )
        isTime -> CasinhaTimeInput(
            value = value,
            onValueChange = onValueChange,
            placeholder = placeholder.replace(" (HH:MM)", "").replace("HH:MM", "Hora"),
            modifier = modifier,
        )
        else -> OutlinedTextField(
            value = value,
            onValueChange = { onValueChange(sanitizeInput(it, keyboardType)) },
            modifier = modifier,
            placeholder = { Text(placeholder, color = CasinhaPalette.Pink300, fontSize = 13.sp) },
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            singleLine = singleLine,
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = CasinhaPalette.Pink300,
                unfocusedBorderColor = CasinhaPalette.Pink200.copy(alpha = 0.65f),
                focusedContainerColor = Color.White.copy(alpha = 0.84f),
                unfocusedContainerColor = Color.White.copy(alpha = 0.78f),
                cursorColor = CasinhaPalette.Rose500,
                focusedTextColor = CasinhaPalette.Rose700,
                unfocusedTextColor = CasinhaPalette.Rose700,
            ),
        )
    }
}

@Composable
fun CasinhaDateInput(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    allowFuture: Boolean = true,
) {
    val context = LocalContext.current
    val selectedDate = value.toIsoDateOrNull()
    val initialDate = selectedDate ?: LocalDate.now()
    val displayValue = selectedDate?.format(CasinhaDisplayDateFormatter)

    Surface(
        modifier = modifier.clickable {
            DatePickerDialog(
                context,
                { _, year, month, day ->
                    onValueChange(LocalDate.of(year, month + 1, day).format(DateTimeFormatter.ISO_DATE))
                },
                initialDate.year,
                initialDate.monthValue - 1,
                initialDate.dayOfMonth,
            ).apply {
                if (!allowFuture) {
                    datePicker.maxDate = LocalDate.now()
                        .atStartOfDay(ZoneId.systemDefault())
                        .toInstant()
                        .toEpochMilli()
                }
            }.show()
        },
        shape = RoundedCornerShape(16.dp),
        color = Color.White.copy(alpha = 0.8f),
        border = BorderStroke(1.dp, CasinhaPalette.Pink200.copy(alpha = 0.65f)),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = displayValue ?: placeholder,
                color = if (displayValue == null) CasinhaPalette.Pink300 else CasinhaPalette.Rose700,
                fontSize = 13.sp,
                modifier = Modifier.weight(1f),
            )
            Text("📅", fontSize = 16.sp)
        }
    }
}

@Composable
fun CasinhaTimeInput(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val selectedTime = value.toLocalTimeOrNull()
    val initialTime = selectedTime ?: LocalTime.now().withSecond(0).withNano(0)

    Surface(
        modifier = modifier.clickable {
            TimePickerDialog(
                context,
                { _, hour, minute ->
                    onValueChange(LocalTime.of(hour, minute).format(CasinhaTimeFormatter))
                },
                initialTime.hour,
                initialTime.minute,
                true,
            ).show()
        },
        shape = RoundedCornerShape(16.dp),
        color = Color.White.copy(alpha = 0.8f),
        border = BorderStroke(1.dp, CasinhaPalette.Pink200.copy(alpha = 0.65f)),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = selectedTime?.format(CasinhaTimeFormatter) ?: placeholder,
                color = if (selectedTime == null) CasinhaPalette.Pink300 else CasinhaPalette.Rose700,
                fontSize = 13.sp,
                modifier = Modifier.weight(1f),
            )
            Text("🕐", fontSize = 16.sp)
        }
    }
}

internal fun sanitizeInput(value: String, keyboardType: KeyboardType): String = when (keyboardType) {
    KeyboardType.Number, KeyboardType.NumberPassword -> value.filter(Char::isDigit)
    KeyboardType.Decimal -> sanitizeDecimalInput(value)
    else -> value
}

internal fun sanitizeDecimalInput(value: String): String {
    val cleaned = value.filter { it.isDigit() || it == ',' || it == '.' }
    val separatorIndex = cleaned.indexOfFirst { it == ',' || it == '.' }
    if (separatorIndex < 0) return cleaned
    val integerPart = cleaned.substring(0, separatorIndex).filter(Char::isDigit)
    val decimalPart = cleaned.substring(separatorIndex + 1).filter(Char::isDigit)
    val separator = cleaned[separatorIndex]
    return "$integerPart$separator$decimalPart"
}

private fun String.toIsoDateOrNull(): LocalDate? = try {
    if (isBlank()) null else LocalDate.parse(this, DateTimeFormatter.ISO_DATE)
} catch (_: DateTimeParseException) {
    null
}

private fun String.toLocalTimeOrNull(): LocalTime? = try {
    if (isBlank()) null else LocalTime.parse(this, CasinhaTimeFormatter)
} catch (_: DateTimeParseException) {
    null
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
