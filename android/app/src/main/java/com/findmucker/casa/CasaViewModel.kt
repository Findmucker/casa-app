package com.findmucker.casa

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.firestore.ListenerRegistration
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
    private val listeners = mutableListOf<ListenerRegistration>()
    private val eventItemListeners = mutableMapOf<String, ListenerRegistration>()

    init {
        runOperation { repository.restoreSession() }
    }

    fun signIn(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) return showError("Preenche o email e a palavra-passe.")
        runOperation { repository.signIn(email, password) }
    }

    fun register(name: String, email: String, password: String, birthDate: String) {
        if (name.isBlank() || email.isBlank() || password.isBlank() || birthDate.isBlank()) {
            return showError("Preenche o nome, data de nascimento, email e palavra-passe.")
        }
        if (password.length < 6) return showError("Escolhe uma palavra-passe com pelo menos 6 caracteres.")
        runOperation { repository.register(name, email, password, birthDate) }
    }

    fun signInWithGoogle(context: Context) = runOperation { repository.signInWithGoogle(context) }

    fun createHouse(name: String) {
        val profile = (_uiState.value.session as? SessionState.NeedsHouse)?.profile ?: return
        runOperation { repository.createHouse(profile, name) }
    }

    fun joinHouse(code: String) {
        val profile = (_uiState.value.session as? SessionState.NeedsHouse)?.profile ?: return
        runOperation { repository.joinHouse(profile, code) }
    }

    fun signOut() {
        stopListeners()
        repository.signOut()
        _uiState.value = CasaUiState(session = SessionState.SignedOut)
    }

    fun addItem(section: HouseSection, name: String) {
        addItem(section, ItemDraft(name = name))
    }

    fun addItem(section: HouseSection, draft: ItemDraft) {
        val ready = readySession() ?: return
        runAction { repository.addItem(ready.house.id, section, draft, ready.profile.name) }
    }

    fun toggleItem(section: HouseSection, item: HouseItem) {
        val ready = readySession() ?: return
        runAction { repository.toggleItem(ready.house.id, section, item) }
    }

    fun deleteItem(section: HouseSection, itemId: String) {
        val ready = readySession() ?: return
        runAction { repository.deleteItem(ready.house.id, section, itemId) }
    }

    fun updateItem(section: HouseSection, itemId: String, values: Map<String, Any?>) {
        val ready = readySession() ?: return
        runAction("Alterações guardadas.") { repository.updateItem(ready.house.id, section, itemId, values) }
    }

    fun moveItem(section: HouseSection, item: HouseItem, before: HouseItem) {
        val ready = readySession() ?: return
        runAction { repository.moveItem(ready.house.id, section, item, before) }
    }

    fun addSubtask(project: HouseItem, name: String) {
        val ready = readySession() ?: return
        runAction { repository.addSubtask(ready.house.id, project, name) }
    }

    fun toggleSubtask(project: HouseItem, subtask: Subtask) {
        val ready = readySession() ?: return
        runAction { repository.toggleSubtask(ready.house.id, project, subtask) }
    }

    fun deleteSubtask(project: HouseItem, subtaskId: String) {
        val ready = readySession() ?: return
        runAction { repository.deleteSubtask(ready.house.id, project, subtaskId) }
    }

    fun addExpense(name: String, amount: String, category: String, paidBy: String) {
        val ready = readySession() ?: return
        val parsed = amount.parseAmount() ?: return showError("Indica um valor válido.")
        runAction("Despesa adicionada.") { repository.addExpense(ready.house.id, name, parsed, category, paidBy) }
    }

    fun addIncome(name: String, amount: String, owner: String, recurring: Boolean) {
        val ready = readySession() ?: return
        val parsed = amount.parseAmount() ?: return showError("Indica um valor válido.")
        runAction("Rendimento adicionado.") { repository.addIncome(ready.house.id, name, parsed, owner, recurring) }
    }

    fun addSavingsGoal(name: String, emoji: String, target: String) {
        val ready = readySession() ?: return
        val parsed = target.parseAmount() ?: return showError("Indica um valor válido.")
        runAction("Objetivo criado.") { repository.addSavingsGoal(ready.house.id, name, emoji, parsed) }
    }

    fun depositSavings(goal: SavingsGoal, amount: String) {
        val ready = readySession() ?: return
        val parsed = amount.parseAmount() ?: return showError("Indica um valor válido.")
        runAction("Poupança atualizada.") { repository.depositSavings(ready.house.id, goal, parsed) }
    }

    fun deleteExtra(collection: String, id: String) {
        val ready = readySession() ?: return
        runAction { repository.deleteExtra(ready.house.id, collection, id) }
    }

    fun addEvent(title: String, date: String, guests: String) {
        val ready = readySession() ?: return
        runAction("Evento criado.") {
            repository.addEvent(ready.house.id, title, date, guests.toIntOrNull() ?: 1, ready.profile.name)
        }
    }

    fun toggleEvent(event: CasaEvent) {
        val ready = readySession() ?: return
        runAction { repository.toggleEvent(ready.house.id, event) }
    }

    fun updateEvent(eventId: String, values: Map<String, Any?>) {
        val ready = readySession() ?: return
        runAction("Evento atualizado.") { repository.updateEvent(ready.house.id, eventId, values) }
    }

    fun addEventItem(eventId: String, name: String, type: String, assignee: String?) {
        val ready = readySession() ?: return
        runAction { repository.addEventItem(ready.house.id, eventId, name, type, assignee) }
    }

    fun toggleEventItem(eventId: String, item: EventItem) {
        val ready = readySession() ?: return
        runAction { repository.updateEventItem(ready.house.id, eventId, item.id, mapOf("done" to !item.done)) }
    }

    fun assignEventItem(eventId: String, itemId: String, assignee: String) {
        val ready = readySession() ?: return
        runAction { repository.updateEventItem(ready.house.id, eventId, itemId, mapOf("assignee" to assignee)) }
    }

    fun renameEventItem(eventId: String, itemId: String, name: String) {
        val ready = readySession() ?: return
        if (name.isBlank()) return
        runAction { repository.updateEventItem(ready.house.id, eventId, itemId, mapOf("name" to name.trim())) }
    }

    fun deleteEventItem(eventId: String, itemId: String) {
        val ready = readySession() ?: return
        runAction { repository.deleteEventItem(ready.house.id, eventId, itemId) }
    }

    fun cloneEvent(event: CasaEvent) {
        val ready = readySession() ?: return
        runAction("Evento clonado.") { repository.cloneEvent(ready.house.id, event) }
    }

    fun shareEvent(event: CasaEvent) {
        val ready = readySession() ?: return
        runAction {
            val url = repository.createEventShare(
                ready.house.id,
                event,
                _uiState.value.dashboard.eventItems[event.id].orEmpty(),
            )
            _uiState.update { it.copy(shareUrl = url) }
        }
    }

    fun consumeShareUrl() = _uiState.update { it.copy(shareUrl = null) }

    fun renameHouse(name: String) {
        val ready = readySession() ?: return
        runAction("Nome da casa atualizado.") {
            repository.renameHouse(ready.house.id, name)
            _uiState.update { state ->
                state.copy(session = ready.copy(house = ready.house.copy(name = name.trim())))
            }
        }
    }

    fun updateProfile(name: String, birthDate: String?) {
        val ready = readySession() ?: return
        runAction("Perfil atualizado.") {
            repository.updateProfile(ready.profile, name, birthDate)
            val cleanName = name.trim()
            val members = ready.house.members.map { member ->
                if (member.uid == ready.profile.uid) member.copy(name = cleanName) else member
            }
            _uiState.update { state ->
                state.copy(
                    session = ready.copy(
                        profile = ready.profile.copy(name = cleanName, birthDate = birthDate),
                        house = ready.house.copy(members = members),
                    ),
                )
            }
        }
    }

    fun equipItem(itemId: String, slot: LootSlot) {
        val ready = readySession() ?: return
        runAction("Item equipado.") { repository.equipItem(ready.profile.name, itemId, slot) }
    }

    fun unequipItem(slot: LootSlot) {
        val ready = readySession() ?: return
        runAction("Item removido.") { repository.unequipItem(ready.profile.name, slot) }
    }

    fun saveAvatar(avatar: AvatarConfig) {
        val ready = readySession() ?: return
        runAction("Avatar guardado.") { repository.saveAvatar(ready.profile.name, avatar) }
    }

    fun openLootBox() {
        val ready = readySession() ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(working = true, error = null, notice = null) }
            runCatching { repository.openLootBox(ready.profile.name) }
                .onSuccess { reward ->
                    _uiState.update { it.copy(working = false, notice = "${reward.emoji} Recebeste ${reward.name}!") }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(working = false, error = FirebaseCasaRepository.friendlyError(error)) }
                }
        }
    }

    fun createInvite() {
        val ready = readySession() ?: return
        runAction("Convite válido por 7 dias.") {
            val code = repository.createInvite(ready.house, ready.profile.uid)
            _uiState.update { it.copy(inviteCode = code) }
        }
    }

    fun loadFriendCode() {
        val ready = readySession() ?: return
        if (_uiState.value.friendCode != null) return
        runAction {
            val code = repository.getOrCreateFriendCode(ready.house.id)
            _uiState.update { it.copy(friendCode = code) }
        }
    }

    fun connectFriend(code: String) {
        val ready = readySession() ?: return
        runAction("Casa amiga ligada.") { repository.connectFriend(ready.house, code) }
    }

    fun removeFriend(id: String) {
        val ready = readySession() ?: return
        runAction("Casa amiga removida.") { repository.deleteExtra(ready.house.id, "friends", id) }
    }

    fun sendMessage(to: String, message: String) {
        val ready = readySession() ?: return
        runAction("Mensagem enviada.") { repository.sendMessage(to, ready.profile.name, message) }
    }

    fun refreshWeather() {
        _uiState.update { it.copy(dashboard = it.dashboard.copy(weather = it.dashboard.weather.copy(loading = true))) }
        viewModelScope.launch {
            val weather = repository.loadWeather()
            _uiState.update { it.copy(dashboard = it.dashboard.copy(weather = weather)) }
        }
    }

    fun clearError() = _uiState.update { it.copy(error = null) }
    fun clearNotice() = _uiState.update { it.copy(notice = null) }

    private fun runOperation(operation: suspend () -> SessionState) {
        viewModelScope.launch {
            _uiState.update { it.copy(working = true, error = null, notice = null) }
            runCatching { operation() }
                .onSuccess(::applySession)
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

    private fun runAction(success: String? = null, action: suspend () -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(working = true, error = null, notice = null) }
            runCatching { action() }
                .onSuccess { _uiState.update { it.copy(working = false, notice = success) } }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(working = false, error = FirebaseCasaRepository.friendlyError(error))
                    }
                }
        }
    }

    private fun applySession(session: SessionState) {
        _uiState.value = CasaUiState(session = session)
        if (session is SessionState.Ready) observeDashboard(session)
    }

    private fun observeDashboard(session: SessionState.Ready) {
        stopListeners()
        val houseId = session.house.id
        HouseSection.entries.forEach { section ->
            listeners += repository.observeItems(houseId, section) { result ->
                result.onSuccess { items ->
                    _uiState.update { it.copy(dashboard = it.dashboard.withItems(section, items)) }
                }.onFailure(::showRealtimeError)
            }
        }
        listeners += repository.observeHabitChecks(houseId) { result ->
            result.onSuccess { value -> _uiState.update { it.copy(dashboard = it.dashboard.copy(habitChecks = value)) } }
                .onFailure(::showRealtimeError)
        }
        listeners += repository.observeExpenses(houseId) { result ->
            result.onSuccess { value -> _uiState.update { it.copy(dashboard = it.dashboard.copy(expenses = value)) } }
                .onFailure(::showRealtimeError)
        }
        listeners += repository.observeIncomes(houseId) { result ->
            result.onSuccess { value -> _uiState.update { it.copy(dashboard = it.dashboard.copy(incomes = value)) } }
                .onFailure(::showRealtimeError)
        }
        listeners += repository.observeSavings(houseId) { result ->
            result.onSuccess { value -> _uiState.update { it.copy(dashboard = it.dashboard.copy(savingsGoals = value)) } }
                .onFailure(::showRealtimeError)
        }
        listeners += repository.observeEvents(houseId) { result ->
            result.onSuccess { value ->
                _uiState.update { it.copy(dashboard = it.dashboard.copy(events = value)) }
                syncEventItemListeners(houseId, value)
            }
                .onFailure(::showRealtimeError)
        }
        listeners += repository.observeFriends(houseId) { result ->
            result.onSuccess { value -> _uiState.update { it.copy(dashboard = it.dashboard.copy(friends = value)) } }
                .onFailure(::showRealtimeError)
        }
        listeners += repository.observeGamification(session.profile.name) { result ->
            result.onSuccess { value -> _uiState.update { it.copy(dashboard = it.dashboard.copy(gamification = value)) } }
                .onFailure { /* gamification is optional */ }
        }
        session.house.members.filter { it.name != session.profile.name }.forEach { member ->
            listeners += repository.observeGamification(member.name) { result ->
                result.onSuccess { value ->
                    _uiState.update {
                        it.copy(dashboard = it.dashboard.copy(memberGamification = it.dashboard.memberGamification + (member.name to value)))
                    }
                }.onFailure { /* member gamification is optional */ }
            }
        }
        refreshWeather()
    }

    private fun stopListeners() {
        listeners.forEach(ListenerRegistration::remove)
        listeners.clear()
        eventItemListeners.values.forEach(ListenerRegistration::remove)
        eventItemListeners.clear()
    }

    private fun syncEventItemListeners(houseId: String, events: List<CasaEvent>) {
        val activeIds = events.mapTo(mutableSetOf()) { it.id }
        (eventItemListeners.keys - activeIds).forEach { staleId ->
            eventItemListeners.remove(staleId)?.remove()
            _uiState.update { it.copy(dashboard = it.dashboard.copy(eventItems = it.dashboard.eventItems - staleId)) }
        }
        events.filterNot { eventItemListeners.containsKey(it.id) }.forEach { event ->
            eventItemListeners[event.id] = repository.observeEventItems(houseId, event.id) { result ->
                result.onSuccess { items ->
                    _uiState.update {
                        it.copy(dashboard = it.dashboard.copy(eventItems = it.dashboard.eventItems + (event.id to items)))
                    }
                }.onFailure(::showRealtimeError)
            }
        }
    }

    private fun readySession(): SessionState.Ready? = _uiState.value.session as? SessionState.Ready

    private fun showError(message: String) {
        _uiState.update { it.copy(error = message) }
    }

    private fun showRealtimeError(error: Throwable) {
        _uiState.update { state ->
            if (state.error != null) state else state.copy(error = FirebaseCasaRepository.friendlyError(error))
        }
    }

    private fun String.parseAmount(): Double? = replace(',', '.').toDoubleOrNull()?.takeIf { it > 0 }

    override fun onCleared() {
        stopListeners()
        super.onCleared()
    }
}
