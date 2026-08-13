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

object CasinhaPalette {
    val Rose600 = Color(0xFFBE315F)
    val Rose500 = Color(0xFFD94675)
    val Rose400 = Color(0xFFEB5C8A)
    val Rose300 = Color(0xFFF58FB0)
    val Pink200 = Color(0xFFF9B8CE)
    val Pink100 = Color(0xFFFFDCE8)
    val Pink50 = Color(0xFFFFF0F6)
    val Purple500 = Color(0xFF8B5CF6)
    val Purple400 = Color(0xFFA78BFA)
    val Purple100 = Color(0xFFE9DDFF)
    val Blue400 = Color(0xFF4FAFE3)
    val Blue100 = Color(0xFFD9F2FF)
    val Emerald500 = Color(0xFF22A67A)
    val Emerald100 = Color(0xFFD6F7EA)
    val Ink = Color(0xFF402A35)
    val MutedInk = Color(0xFF785B69)
    val Background = Color(0xFFFFF5F9)
    val Surface = Color(0xFFFFFBFD)
}

private val CasinhaColors = lightColorScheme(
    primary = CasinhaPalette.Rose500,
    onPrimary = Color.White,
    primaryContainer = CasinhaPalette.Pink100,
    onPrimaryContainer = CasinhaPalette.Rose600,
    secondary = CasinhaPalette.Purple500,
    onSecondary = Color.White,
    secondaryContainer = CasinhaPalette.Purple100,
    onSecondaryContainer = Color(0xFF4C2D83),
    tertiary = CasinhaPalette.Blue400,
    background = CasinhaPalette.Background,
    onBackground = CasinhaPalette.Ink,
    surface = CasinhaPalette.Surface,
    onSurface = CasinhaPalette.Ink,
    surfaceVariant = Color(0xFFFFE8F0),
    onSurfaceVariant = CasinhaPalette.MutedInk,
    outline = CasinhaPalette.Pink200,
    error = Color(0xFFD43B55),
)

private val CasinhaTypography = Typography(
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        letterSpacing = (-0.3).sp,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 17.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
    ),
)

private val CasinhaShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(28.dp),
    extraLarge = RoundedCornerShape(34.dp),
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
