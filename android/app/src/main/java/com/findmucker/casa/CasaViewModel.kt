package com.findmucker.casa

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class CasaViewModel(
    private val repository: FirebaseCasaRepository = FirebaseCasaRepository(),
) : ViewModel() {
    private val _uiState = MutableStateFlow(CasaUiState())
    val uiState: StateFlow<CasaUiState> = _uiState.asStateFlow()

    init {
        runOperation { repository.restoreSession() }
    }

    fun signIn(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            showError("Preenche o email e a palavra-passe.")
            return
        }
        runOperation { repository.signIn(email, password) }
    }

    fun register(name: String, email: String, password: String) {
        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            showError("Preenche o nome, email e palavra-passe.")
            return
        }
        if (password.length < 6) {
            showError("Escolhe uma palavra-passe com pelo menos 6 caracteres.")
            return
        }
        runOperation { repository.register(name, email, password) }
    }

    fun signInWithGoogle(context: Context) {
        runOperation { repository.signInWithGoogle(context) }
    }

    fun createHouse(name: String) {
        val profile = (_uiState.value.session as? SessionState.NeedsHouse)?.profile ?: return
        runOperation { repository.createHouse(profile, name) }
    }

    fun joinHouse(code: String) {
        val profile = (_uiState.value.session as? SessionState.NeedsHouse)?.profile ?: return
        runOperation { repository.joinHouse(profile, code) }
    }

    fun signOut() {
        repository.signOut()
        _uiState.value = CasaUiState(session = SessionState.SignedOut)
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    private fun runOperation(operation: suspend () -> SessionState) {
        viewModelScope.launch {
            _uiState.update { it.copy(working = true, error = null) }
            runCatching { operation() }
                .onSuccess { session -> _uiState.value = CasaUiState(session = session) }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            session = if (repository.hasAuthenticatedUser) it.session else SessionState.SignedOut,
                            working = false,
                            error = FirebaseCasaRepository.friendlyError(error),
                        )
                    }
                }
        }
    }

    private fun showError(message: String) {
        _uiState.update { it.copy(error = message) }
    }
}
