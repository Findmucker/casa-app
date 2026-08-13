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
    fun `native navigation matches the nine web tabs in order`() {
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
    fun `level progression matches the web profile`() {
        assertEquals(1, levelForPoints(0))
        assertEquals(1, levelForPoints(49))
        assertEquals(2, levelForPoints(50))
        assertEquals(11, levelForPoints(500))
    }

    @Test
    fun `native loot catalog matches all six web equipment slots`() {
        assertEquals(30, CasinhaLoot.size)
        assertEquals(LootSlot.entries.toSet(), CasinhaLoot.map { it.slot }.toSet())
        assertEquals(5, CasinhaLoot.count { it.slot == LootSlot.HELMET })
    }

    @Test
    fun `avatar editor preserves the eight shared firestore fields`() {
        val avatar = AvatarSlot.entries.fold(AvatarConfig()) { current, slot ->
            current.withValue(slot, slot.ordinal + 1)
        }

        assertEquals(AvatarSlot.entries.map { it.ordinal + 1 }, AvatarSlot.entries.map(avatar::value))
        assertEquals(AvatarSlot.entries.map { it.key }.toSet(), avatar.asFirestoreMap().keys)
    }

    @Test
    fun `pending loot boxes follow the web fifty point threshold`() {
        assertEquals(0, pendingLootBoxes(GamificationProfile(points = 49)))
        assertEquals(2, pendingLootBoxes(GamificationProfile(points = 150, boxesOpened = 1)))
    }

    @Test
    fun `weather favorites preserve the web limit and default fallback`() {
        val locations = (1..11).map { index ->
            WeatherLocation("place-$index", index.toDouble(), index.toDouble(), "Local $index", "Local $index", "auto", "geocoding")
        }
        val preferences = locations.fold(WeatherPreferences()) { current, location -> current.withFavorite(location) }

        assertEquals(10, preferences.favorites.size)
        val favorite = preferences.copy(defaultMode = "favorite", defaultFavoriteId = "place-2")
        assertEquals("place-2", favorite.resolvedLocation().id)
        assertEquals(DefaultWeatherLocation, favorite.withoutFavorite("place-2").resolvedLocation())
    }
}
