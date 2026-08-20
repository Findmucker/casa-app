package com.findmucker.casa

import org.junit.Assert.assertEquals
import org.junit.Test

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
        assertEquals(false, HouseSection.SHOPPING in dashboard.loading)
        assertEquals(true, HouseSection.HABITS in dashboard.loading)
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
        assertEquals("🐼", BasicAnimalAvatars.first().first)
        assertEquals("🐸", BasicAnimalAvatars.last().first)
    }

    @Test
    fun `weather favorites preserve the native limit and default fallback`() {
        val locations = (1..11).map { index ->
            WeatherLocation("place-$index", index.toDouble(), index.toDouble(), "Local $index", "Local $index", "auto", "geocoding")
        }
        val preferences = locations.fold(WeatherPreferences()) { current, location -> current.withFavorite(location) }

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
}
