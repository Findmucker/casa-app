package com.findmucker.casa

data class UserProfile(
    val uid: String,
    val name: String,
    val email: String?,
    val avatar: String = "👤",
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
    SMALL_PRIORITIES("priorities_small", "Coisinhas", "🪴"),
    PROJECTS("priorities_big", "Projetos", "🏠"),
    HABITS("habits", "Hábitos", "✨"),
}

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
)

data class DashboardState(
    val items: Map<HouseSection, List<HouseItem>> = HouseSection.entries.associateWith { emptyList() },
    val loading: Set<HouseSection> = HouseSection.entries.toSet(),
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
)

fun nextProjectStatus(status: String?): String = when (status) {
    "pendente" -> "em progresso"
    "em progresso" -> "concluido"
    else -> "pendente"
}
