package com.findmucker.casa

import androidx.compose.ui.text.input.KeyboardType
import org.junit.Assert.assertEquals
import org.junit.Test

class SemanticInputTest {
    @Test
    fun numberInputRejectsNonDigits() {
        assertEquals("123", sanitizeInput("1a2-3", KeyboardType.Number))
    }

    @Test
    fun decimalInputKeepsOneSeparatorAndDigits() {
        assertEquals("12,345", sanitizeInput("12,3a.45", KeyboardType.Decimal))
        assertEquals("12.34", sanitizeInput("12.3x4", KeyboardType.Decimal))
    }

    @Test
    fun textInputIsNotModified() {
        assertEquals("Casa 12-A", sanitizeInput("Casa 12-A", KeyboardType.Text))
    }
}
