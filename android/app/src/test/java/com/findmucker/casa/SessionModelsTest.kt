package com.findmucker.casa

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
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
    fun `legacy point fields stay readable without affecting activity stats`() {
        val activity = GamificationProfile(
            totalCompleted = 8,
            maxStreak = 4,
            shoppingDone = 3,
            coisinhasDone = 2,
            projectsDone = 1,
            habitsDone = 4,
        )
        val legacy = activity.copy(points = 500, boxesOpened = 7)

        assertEquals(500, legacy.points)
        assertEquals(7, legacy.boxesOpened)
        assertEquals(rpgStats(activity), rpgStats(legacy))
    }

    @Test
    fun `activity is recorded only when persisted state becomes complete`() {
        assertTrue(isCompletionTransition(wasCompleted = false, isCompleted = true))
        assertFalse(isCompletionTransition(wasCompleted = false, isCompleted = false))
        assertFalse(isCompletionTransition(wasCompleted = true, isCompleted = true))
        assertFalse(isCompletionTransition(wasCompleted = true, isCompleted = false))
    }

    @Test
    fun `completed activities increment their own counters and habit streak maximum`() {
        val initial = GamificationProfile(
            totalCompleted = 10,
            maxStreak = 4,
            shoppingDone = 3,
            coisinhasDone = 2,
            projectsDone = 1,
            habitsDone = 4,
        )
        val afterShopping = initial.withCompletedActivity(HouseSection.SHOPPING)
        val afterPriority = afterShopping.withCompletedActivity(HouseSection.SMALL_PRIORITIES)
        val afterProject = afterPriority.withCompletedActivity(HouseSection.PROJECTS)
        val afterHabit = afterProject.withCompletedActivity(HouseSection.HABITS, streak = 7)

        assertEquals(14, afterHabit.totalCompleted)
        assertEquals(4, afterHabit.shoppingDone)
        assertEquals(3, afterHabit.coisinhasDone)
        assertEquals(2, afterHabit.projectsDone)
        assertEquals(5, afterHabit.habitsDone)
        assertEquals(7, afterHabit.maxStreak)
        assertEquals(7, afterHabit.withCompletedActivity(HouseSection.HABITS, streak = 3).maxStreak)
    }

    @Test
    fun `activity firestore updates never contain legacy progression fields`() {
        val update = GamificationProfile(points = 500, boxesOpened = 7)
            .withCompletedActivity(HouseSection.PROJECTS)
            .activityStatsAsFirestoreMap(HouseSection.PROJECTS.completedAction())

        assertEquals("project_done", update["lastAction"])
        assertEquals(1, update["totalCompleted"])
        assertFalse(update.containsKey("points"))
        assertFalse(update.containsKey("boxesOpened"))
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
