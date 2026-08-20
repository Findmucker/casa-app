package com.findmucker.casa

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Exact Tailwind colour family used by the existing web client. */
object CasinhaPalette {
    val Rose700 = Color(0xFFBE123C)
    val Rose600 = Color(0xFFE11D48)
    val Rose500 = Color(0xFFF43F5E)
    val Rose400 = Color(0xFFFB7185)
    val Rose300 = Color(0xFFFDA4AF)
    val Rose200 = Color(0xFFFECDD3)
    val Rose100 = Color(0xFFFFE4E6)
    val Rose50 = Color(0xFFFFF1F2)

    val Pink600 = Color(0xFFDB2777)
    val Pink500 = Color(0xFFEC4899)
    val Pink400 = Color(0xFFF472B6)
    val Pink300 = Color(0xFFF9A8D4)
    val Pink200 = Color(0xFFFBCFE8)
    val Pink100 = Color(0xFFFCE7F3)
    val Pink50 = Color(0xFFFDF2F8)

    val Purple600 = Color(0xFF9333EA)
    val Purple500 = Color(0xFFA855F7)
    val Purple400 = Color(0xFFC084FC)
    val Purple300 = Color(0xFFD8B4FE)
    val Purple200 = Color(0xFFE9D5FF)
    val Purple100 = Color(0xFFF3E8FF)
    val Purple50 = Color(0xFFFAF5FF)

    val Blue600 = Color(0xFF2563EB)
    val Blue400 = Color(0xFF60A5FA)
    val Blue100 = Color(0xFFDBEAFE)
    val Emerald700 = Color(0xFF047857)
    val Emerald600 = Color(0xFF059669)
    val Emerald500 = Color(0xFF10B981)
    val Emerald400 = Color(0xFF34D399)
    val Emerald200 = Color(0xFFA7F3D0)
    val Emerald100 = Color(0xFFD1FAE5)
    val Emerald50 = Color(0xFFECFDF5)
    val Amber500 = Color(0xFFF59E0B)
    val Red500 = Color(0xFFEF4444)

    val Ink = Color(0xFF374151)
    val MutedInk = Color(0xFF6B7280)
    val Background = Color(0xFFFEF7FA)
    val Surface = Color(0xFFFFFBFD)
}

private val CasinhaColors = lightColorScheme(
    primary = CasinhaPalette.Rose400,
    onPrimary = Color.White,
    primaryContainer = CasinhaPalette.Pink100,
    onPrimaryContainer = CasinhaPalette.Rose700,
    secondary = CasinhaPalette.Purple400,
    onSecondary = Color.White,
    secondaryContainer = CasinhaPalette.Purple100,
    onSecondaryContainer = CasinhaPalette.Purple600,
    tertiary = CasinhaPalette.Emerald500,
    background = CasinhaPalette.Background,
    onBackground = CasinhaPalette.Ink,
    surface = CasinhaPalette.Surface,
    onSurface = CasinhaPalette.Ink,
    surfaceVariant = CasinhaPalette.Pink50,
    onSurfaceVariant = CasinhaPalette.MutedInk,
    outline = CasinhaPalette.Pink200,
    error = CasinhaPalette.Red500,
)

private val CasinhaTypography = Typography(
    headlineSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 20.sp),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 18.sp),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 16.sp),
    titleSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 14.sp),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 15.sp),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 13.sp),
    bodySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 11.sp),
    labelLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 13.sp),
    labelMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = 11.sp),
    labelSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = 9.sp),
)

private val CasinhaShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

@Composable
fun CasinhaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = CasinhaColors,
        typography = CasinhaTypography,
        shapes = CasinhaShapes,
        content = content,
    )
}
