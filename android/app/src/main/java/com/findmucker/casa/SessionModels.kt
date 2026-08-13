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

sealed interface SessionState {
    data object Loading : SessionState
    data object SignedOut : SessionState
    data class NeedsHouse(val profile: UserProfile) : SessionState
    data class Ready(val profile: UserProfile, val house: House) : SessionState
}

data class CasaUiState(
    val session: SessionState = SessionState.Loading,
    val working: Boolean = false,
    val error: String? = null,
)
