package com.findmucker.casa

data class UserProfile(
    val uid: String,
    val name: String,
    val email: String?,
    val avatar: String = "👤",
    val birthDate: String? = null,
    val houseId: String? = null,
)

data class HouseMember(
    val uid: String,
    val name: String,
    val avatar: String,
    val role: String,
)

data class House(
    val id: String,
    val name: String,
    val members: List<HouseMember>,
)

enum class HouseSection(
    val collection: String,
    val title: String,
    val emoji: String,
) {
    SHOPPING("shopping", "Compras", "🛒"),
    SMALL_PRIORITIES("priorities_small", "Coisinhas", "🪄"),
    PROJECTS("priorities_big", "Projetos", "🏡"),
    HABITS("habits", "Rotinas", "🧘"),
}

data class Subtask(
    val id: String,
    val name: String,
    val done: Boolean,
)

data class HouseItem(
    val id: String,
    val name: String,
    val done: Boolean,
    val status: String? = null,
    val emoji: String? = null,
    val urgent: Boolean = false,
    val streak: Int = 0,
    val notes: String? = null,
    val order: Long = 0,
    val category: String? = null,
    val addedBy: String? = null,
    val assignee: String? = null,
    val completedAt: String? = null,
    val price: Double? = null,
    val budget: Double? = null,
    val spent: Double? = null,
    val reminderTime: String? = null,
    val days: List<Int> = emptyList(),
    val subtasks: List<Subtask> = emptyList(),
)

data class ItemDraft(
    val name: String,
    val urgent: Boolean = false,
    val category: String? = null,
    val assignee: String = "ambos",
    val price: Double? = null,
    val notes: String? = null,
    val budget: Double? = null,
    val spent: Double? = null,
    val emoji: String = "✨",
    val reminderTime: String? = null,
    val days: List<Int> = emptyList(),
)

data class HabitCheck(
    val id: String,
    val habitId: String,
    val date: String,
)

data class ExpenseItem(
    val id: String,
    val name: String,
    val amount: Double,
    val category: String,
    val paidBy: String,
    val date: String,
)

data class IncomeItem(
    val id: String,
    val name: String,
    val amount: Double,
    val recurring: Boolean,
    val owner: String,
    val date: String,
)

data class SavingsGoal(
    val id: String,
    val name: String,
    val emoji: String,
    val targetAmount: Double,
    val currentAmount: Double,
    val deadline: String? = null,
)

data class CasaEvent(
    val id: String,
    val title: String,
    val date: String,
    val guests: Int,
    val participants: List<String>,
    val done: Boolean,
)

data class EventItem(
    val id: String,
    val name: String,
    val done: Boolean,
    val type: String,
    val assignee: String? = null,
)

data class FriendHouse(
    val id: String,
    val houseId: String,
    val houseName: String,
    val members: List<String>,
)

data class GamificationProfile(
    val points: Int = 0,
    val totalCompleted: Int = 0,
    val maxStreak: Int = 0,
    val shoppingDone: Int = 0,
    val coisinhasDone: Int = 0,
    val projectsDone: Int = 0,
    val habitsDone: Int = 0,
    val badges: List<String> = emptyList(),
    val inventory: List<InventoryItem> = emptyList(),
    val equipped: Map<LootSlot, String> = emptyMap(),
    val boxesOpened: Int = 0,
    val avatar: AvatarConfig = AvatarConfig(),
)

fun isCompletionTransition(wasCompleted: Boolean, isCompleted: Boolean): Boolean =
    !wasCompleted && isCompleted

fun GamificationProfile.withCompletedActivity(
    section: HouseSection,
    streak: Int = 0,
): GamificationProfile = copy(
    totalCompleted = totalCompleted + 1,
    maxStreak = if (section == HouseSection.HABITS) maxOf(maxStreak, streak) else maxStreak,
    shoppingDone = shoppingDone + if (section == HouseSection.SHOPPING) 1 else 0,
    coisinhasDone = coisinhasDone + if (section == HouseSection.SMALL_PRIORITIES) 1 else 0,
    projectsDone = projectsDone + if (section == HouseSection.PROJECTS) 1 else 0,
    habitsDone = habitsDone + if (section == HouseSection.HABITS) 1 else 0,
)

fun GamificationProfile.activityStatsAsFirestoreMap(lastAction: String): Map<String, Any> = mapOf(
    "totalCompleted" to totalCompleted,
    "maxStreak" to maxStreak,
    "shoppingDone" to shoppingDone,
    "coisinhasDone" to coisinhasDone,
    "projectsDone" to projectsDone,
    "habitsDone" to habitsDone,
    "lastAction" to lastAction,
)

fun HouseSection.completedAction(): String = when (this) {
    HouseSection.SHOPPING -> "shopping_done"
    HouseSection.SMALL_PRIORITIES -> "coisinha_done"
    HouseSection.PROJECTS -> "project_done"
    HouseSection.HABITS -> "habit_check"
}

data class WeatherDay(
    val date: String,
    val minimum: Int,
    val maximum: Int,
    val weatherCode: Int,
    val precipitationProbability: Int,
)

data class WeatherState(
    val loading: Boolean = true,
    val activeLocation: WeatherLocation = DefaultWeatherLocation,
    val preferences: WeatherPreferences = WeatherPreferences(),
    val searchResults: List<WeatherLocation> = emptyList(),
    val searching: Boolean = false,
    val locating: Boolean = false,
    val temperature: Int? = null,
    val windSpeed: Int? = null,
    val weatherCode: Int? = null,
    val days: List<WeatherDay> = emptyList(),
    val error: String? = null,
) {
    val location: String get() = activeLocation.name
}

data class DashboardState(
    val items: Map<HouseSection, List<HouseItem>> = HouseSection.entries.associateWith { emptyList() },
    val loading: Set<HouseSection> = HouseSection.entries.toSet(),
    val habitChecks: List<HabitCheck> = emptyList(),
    val expenses: List<ExpenseItem> = emptyList(),
    val incomes: List<IncomeItem> = emptyList(),
    val savingsGoals: List<SavingsGoal> = emptyList(),
    val events: List<CasaEvent> = emptyList(),
    val eventItems: Map<String, List<EventItem>> = emptyMap(),
    val friends: List<FriendHouse> = emptyList(),
    val gamification: GamificationProfile = GamificationProfile(),
    val memberGamification: Map<String, GamificationProfile> = emptyMap(),
    val birthdays: List<BirthdayEntry> = emptyList(),
    val weather: WeatherState = WeatherState(),
) {
    fun forSection(section: HouseSection): List<HouseItem> = items[section].orEmpty()

    fun withItems(section: HouseSection, newItems: List<HouseItem>): DashboardState = copy(
        items = items + (section to newItems),
        loading = loading - section,
    )
}

sealed interface SessionState {
    data object Loading : SessionState
    data object SignedOut : SessionState
    data class NeedsHouse(val profile: UserProfile) : SessionState
    data class Ready(val profile: UserProfile, val house: House) : SessionState
}

data class CasaUiState(
    val session: SessionState = SessionState.Loading,
    val dashboard: DashboardState = DashboardState(),
    val working: Boolean = false,
    val error: String? = null,
    val notice: String? = null,
    val inviteCode: String? = null,
    val friendCode: String? = null,
    val shareUrl: String? = null,
)

fun nextProjectStatus(status: String?): String = when (status) {
    "pendente" -> "em progresso"
    "em progresso" -> "concluido"
    else -> "pendente"
}
