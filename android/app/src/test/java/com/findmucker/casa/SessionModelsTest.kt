package com.findmucker.casa

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.ZoneId
import java.time.ZonedDateTime

class SessionModelsTest {
    @Test
    fun `project status cycles through every native state`() {
        assertEquals("em progresso", nextProjectStatus("pendente"))
        assertEquals("concluido", nextProjectStatus("em progresso"))
        assertEquals("pendente", nextProjectStatus("concluido"))
    }

    @Test
    fun `dashboard replaces only the updated collection`() {
        val shopping = listOf(HouseItem(id = "one", name = "Leite", done = false))
        val dashboard = DashboardState().withItems(HouseSection.SHOPPING, shopping)

        assertEquals(shopping, dashboard.forSection(HouseSection.SHOPPING))
        assertEquals(emptyList<HouseItem>(), dashboard.forSection(HouseSection.HABITS))
        assertFalse(HouseSection.SHOPPING in dashboard.loading)
        assertTrue(HouseSection.HABITS in dashboard.loading)
    }

    @Test
    fun `native navigation exposes the nine product tabs in order`() {
        assertEquals(
            listOf(
                "Início",
                "Compras",
                "Coisinhas",
                "Projetos",
                "Rotinas",
                "Finanças",
                "Calendário",
                "Eventos",
                "Tempo",
            ),
            DashboardTab.entries.map { it.label },
        )
    }

    @Test
    fun `basic avatar choices stay intentionally small`() {
        assertEquals(11, BasicAnimalAvatars.size)
        assertEquals(DefaultAvatarEmoji, BasicAnimalAvatars.first().emoji)
        assertEquals("🐸", BasicAnimalAvatars.last().emoji)
        assertTrue(isSupportedAvatar("🐱"))
        assertFalse(isSupportedAvatar("🦄"))
    }

    @Test
    fun `weather favorites preserve the native limit and default fallback`() {
        val locations = (1..11).map { index ->
            WeatherLocation(
                id = "place-$index",
                latitude = index.toDouble(),
                longitude = index.toDouble(),
                name = "Local $index",
                displayName = "Local $index",
                source = "auto",
                provider = "geocoding",
            )
        }
        val preferences = locations.fold(WeatherPreferences()) { current, location ->
            current.withFavorite(location)
        }

        assertEquals(10, preferences.favorites.size)
        val favorite = preferences.copy(defaultMode = "favorite", defaultFavoriteId = "place-2")
        assertEquals("place-2", favorite.resolvedLocation().id)
        assertEquals(DefaultWeatherLocation, favorite.withoutFavorite("place-2").resolvedLocation())
    }

    @Test
    fun `native notification tags open the matching product tabs`() {
        assertEquals(DashboardTab.HABITS, notificationTabForTag("habit-water"))
        assertEquals(DashboardTab.SHOPPING, notificationTabForTag("urgent-shopping"))
        assertEquals(DashboardTab.EVENTS, notificationTabForTag("new-event"))
        assertEquals(DashboardTab.EVENTS, notificationTabForTag("event-reminder-party"))
        assertEquals(DashboardTab.CALENDAR, notificationTabForTag("birthday-alex"))
        assertEquals(DashboardTab.HOME, notificationTabForTag("message-house"))
    }

    @Test
    fun `habit reminder uses the next configured day`() {
        val zone = ZoneId.of("Europe/Lisbon")
        val mondayMorning = ZonedDateTime.of(2026, 8, 17, 8, 0, 0, 0, zone)
        val occurrence = nextHabitOccurrence(
            reminderTime = "09:30",
            days = listOf(1),
            afterMillis = mondayMorning.toInstant().toEpochMilli(),
            skipDate = null,
            zoneId = zone,
        )

        assertNotNull(occurrence)
        val trigger = ZonedDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(requireNotNull(occurrence).triggerMillis),
            zone,
        )
        assertEquals(2026, trigger.year)
        assertEquals(8, trigger.monthValue)
        assertEquals(17, trigger.dayOfMonth)
        assertEquals(9, trigger.hour)
        assertEquals(30, trigger.minute)
    }

    @Test
    fun `habit reminder skips a completed occurrence`() {
        val zone = ZoneId.of("Europe/Lisbon")
        val mondayMorning = ZonedDateTime.of(2026, 8, 17, 8, 0, 0, 0, zone)
        val occurrence = nextHabitOccurrence(
            reminderTime = "09:30",
            days = listOf(1),
            afterMillis = mondayMorning.toInstant().toEpochMilli(),
            skipDate = "2026-08-17",
            zoneId = zone,
        )

        val trigger = ZonedDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(requireNotNull(occurrence).triggerMillis),
            zone,
        )
        assertEquals(24, trigger.dayOfMonth)
    }
}
