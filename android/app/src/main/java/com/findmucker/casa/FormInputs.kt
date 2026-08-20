package com.findmucker.casa

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.util.Locale

private val displayDateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

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
            colors = formFieldColors(),
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

    PickerField(
        value = selectedDate?.format(displayDateFormatter),
        placeholder = placeholder,
        icon = "📅",
        modifier = modifier,
    ) {
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

    PickerField(
        value = selectedTime?.format(timeFormatter),
        placeholder = placeholder,
        icon = "🕐",
        modifier = modifier,
    ) {
        TimePickerDialog(
            context,
            { _, hour, minute -> onValueChange(LocalTime.of(hour, minute).format(timeFormatter)) },
            initialTime.hour,
            initialTime.minute,
            true,
        ).show()
    }
}

@Composable
private fun PickerField(
    value: String?,
    placeholder: String,
    icon: String,
    modifier: Modifier,
    onClick: () -> Unit,
) {
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = Color.White.copy(alpha = 0.8f),
        border = BorderStroke(1.dp, CasinhaPalette.Pink200.copy(alpha = 0.65f)),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = value ?: placeholder,
                color = if (value == null) CasinhaPalette.Pink300 else CasinhaPalette.Rose700,
                fontSize = 13.sp,
                modifier = Modifier.weight(1f),
            )
            Text(icon, fontSize = 16.sp)
        }
    }
}

@Composable
private fun formFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = CasinhaPalette.Pink300,
    unfocusedBorderColor = CasinhaPalette.Pink200.copy(alpha = 0.65f),
    focusedContainerColor = Color.White.copy(alpha = 0.84f),
    unfocusedContainerColor = Color.White.copy(alpha = 0.78f),
    cursorColor = CasinhaPalette.Rose500,
    focusedTextColor = CasinhaPalette.Rose700,
    unfocusedTextColor = CasinhaPalette.Rose700,
)

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
    return "$integerPart${cleaned[separatorIndex]}$decimalPart"
}

private fun String.toIsoDateOrNull(): LocalDate? = try {
    if (isBlank()) null else LocalDate.parse(this, DateTimeFormatter.ISO_DATE)
} catch (_: DateTimeParseException) {
    null
}

private fun String.toLocalTimeOrNull(): LocalTime? = try {
    if (isBlank()) null else LocalTime.parse(this, timeFormatter)
} catch (_: DateTimeParseException) {
    null
}
