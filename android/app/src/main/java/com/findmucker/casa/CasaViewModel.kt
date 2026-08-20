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
    private val avatarRepository: ProfileAvatarRepository = ProfileAvatarRepository(),
) : ViewModel() {
    private val _uiState = MutableStateFlow(CasaUiState())
    val uiState: StateFlow<CasaUiState> = _uiState.asStateFlow()

    private val listeners = mutableListOf<ListenerRegistration>()
    private val eventItemListeners = mutableMapOf<String, ListenerRegistration>()

    init {
        runOperation { repository.restoreSession() }
    }

    fun signIn(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            return showError("Preenche o email e a palavra-passe.")
        }
        runOperation { repository.signIn(email, password) }
    }

    fun register(name: String, email: String, password: String, birthDate: String) {
        if (name.isBlank() || email.isBlank() || password.isBlank() || birthDate.isBlank()) {
            return showError("Preenche o nome, data de nascimento, email e palavra-passe.")
        }
        if (password.length < 6) {
            return showError("Escolhe uma palavra-passe com pelo menos 6 caracteres.")
        }
        runOperation { repository.register(name, email, password, birthDate) }
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
        stopListeners()
        repository.signOut()
        _uiState.value = CasaUiState(session = SessionState.SignedOut)
    }

    fun registerPushToken() {
        val session = readySession() ?: return
        viewModelScope.launch {
            runCatching { repository.registerNotificationToken(session.profile.uid) }
        }
    }

    fun addItem(section: HouseSection, name: String) {
        addItem(section, ItemDraft(name = name))
    }

    fun addItem(section: HouseSection, draft: ItemDraft) {
        val session = readySession() ?: return
        runAction {
            repository.addItem(session.house.id, section, draft, session.profile.name)
        }
    }

    fun toggleItem(section: HouseSection, item: HouseItem) {
        val session = readySession() ?: return
        runAction { repository.toggleItem(session.house.id, section, item) }
    }

    fun deleteItem(section: HouseSection, itemId: String) {
        val session = readySession() ?: return
        runAction { repository.deleteItem(session.house.id, section, itemId) }
    }

    fun updateItem(section: HouseSection, itemId: String, values: Map<String, Any?>) {
        val session = readySession() ?: return
        runAction("Alterações guardadas.") {
            repository.updateItem(session.house.id, section, itemId, values)
        }
    }

    fun moveItem(section: HouseSection, item: HouseItem, before: HouseItem) {
        val session = readySession() ?: return
        runAction { repository.moveItem(session.house.id, section, item, before) }
    }

    fun addSubtask(project: HouseItem, name: String) {
        val session = readySession() ?: return
        runAction { repository.addSubtask(session.house.id, project, name) }
    }

    fun toggleSubtask(project: HouseItem, subtask: Subtask) {
        val session = readySession() ?: return
        runAction { repository.toggleSubtask(session.house.id, project, subtask) }
    }

    fun deleteSubtask(project: HouseItem, subtaskId: String) {
        val session = readySession() ?: return
        runAction { repository.deleteSubtask(session.house.id, project, subtaskId) }
    }

    fun addExpense(name: String, amount: String, category: String, paidBy: String) {
        val session = readySession() ?: return
        val parsedAmount = amount.parseAmount() ?: return showError("Indica um valor válido.")
        runAction("Despesa adicionada.") {
            repository.addExpense(session.house.id, name, parsedAmount, category, paidBy)
        }
    }

    fun addIncome(name: String, amount: String, owner: String, recurring: Boolean) {
        val session = readySession() ?: return
        val parsedAmount = amount.parseAmount() ?: return showError("Indica um valor válido.")
        runAction("Rendimento adicionado.") {
            repository.addIncome(session.house.id, name, parsedAmount, owner, recurring)
        }
    }

    fun addSavingsGoal(name: String, emoji: String, target: String) {
        val session = readySession() ?: return
        val parsedTarget = target.parseAmount() ?: return showError("Indica um valor válido.")
        runAction("Objetivo criado.") {
            repository.addSavingsGoal(session.house.id, name, emoji, parsedTarget)
        }
    }

    fun depositSavings(goal: SavingsGoal, amount: String) {
        val session = readySession() ?: return
        val parsedAmount = amount.parseAmount() ?: return showError("Indica um valor válido.")
        runAction("Poupança atualizada.") {
            repository.depositSavings(session.house.id, goal, parsedAmount)
        }
    }

    fun deleteExtra(collection: String, id: String) {
        val session = readySession() ?: return
        runAction { repository.deleteExtra(session.house.id, collection, id) }
    }

    fun addEvent(title: String, date: String, guests: String) {
        val session = readySession() ?: return
        runAction("Evento criado.") {
            repository.addEvent(
                houseId = session.house.id,
                title = title,
                date = date,
                guests = guests.toIntOrNull() ?: 1,
                creator = session.profile.name,
            )
        }
    }

    fun toggleEvent(event: CasaEvent) {
        val session = readySession() ?: return
        runAction { repository.toggleEvent(session.house.id, event) }
    }

    fun updateEvent(eventId: String, values: Map<String, Any?>) {
        val session = readySession() ?: return
        runAction("Evento atualizado.") {
            repository.updateEvent(session.house.id, eventId, values)
        }
    }

    fun addEventItem(eventId: String, name: String, type: String, assignee: String?) {
        val session = readySession() ?: return
        runAction {
            repository.addEventItem(session.house.id, eventId, name, type, assignee)
        }
    }

    fun toggleEventItem(eventId: String, item: EventItem) {
        val session = readySession() ?: return
        runAction {
            repository.updateEventItem(
                session.house.id,
                eventId,
                item.id,
                mapOf("done" to !item.done),
            )
        }
    }

    fun assignEventItem(eventId: String, itemId: String, assignee: String) {
        val session = readySession() ?: return
        runAction {
            repository.updateEventItem(
                session.house.id,
                eventId,
                itemId,
                mapOf("assignee" to assignee),
            )
        }
    }

    fun renameEventItem(eventId: String, itemId: String, name: String) {
        val session = readySession() ?: return
        val cleanName = name.trim()
        if (cleanName.isEmpty()) return
        runAction {
            repository.updateEventItem(
                session.house.id,
                eventId,
                itemId,
                mapOf("name" to cleanName),
            )
        }
    }

    fun deleteEventItem(eventId: String, itemId: String) {
        val session = readySession() ?: return
        runAction { repository.deleteEventItem(session.house.id, eventId, itemId) }
    }

    fun cloneEvent(event: CasaEvent) {
        val session = readySession() ?: return
        runAction("Evento clonado.") { repository.cloneEvent(session.house.id, event) }
    }

    fun shareEvent(event: CasaEvent) {
        val items = _uiState.value.dashboard.eventItems[event.id].orEmpty()
        _uiState.update { it.copy(shareUrl = buildEventShareText(event, items)) }
    }

    fun consumeShareUrl() {
        _uiState.update { it.copy(shareUrl = null) }
    }

    fun renameHouse(name: String) {
        val session = readySession() ?: return
        runAction("Nome da casa atualizado.") {
            repository.renameHouse(session.house.id, name)
            _uiState.update { state ->
                state.copy(
                    session = session.copy(
                        house = session.house.copy(name = name.trim()),
                    ),
                )
            }
        }
    }

    fun updateProfile(name: String, birthDate: String?) {
        val session = readySession() ?: return
        runAction("Perfil atualizado.") {
            repository.updateProfile(session.profile, name, birthDate)
            val cleanName = name.trim()
            val members = session.house.members.map { member ->
                if (member.uid == session.profile.uid) member.copy(name = cleanName) else member
            }
            _uiState.update { state ->
                state.copy(
                    session = session.copy(
                        profile = session.profile.copy(name = cleanName, birthDate = birthDate),
                        house = session.house.copy(members = members),
                    ),
                )
            }
        }
    }

    fun saveAvatar(avatar: String) {
        val session = readySession() ?: return
        runAction("Animal guardado.") {
            avatarRepository.saveAvatar(session.profile, session.house, avatar)
            val members = session.house.members.map { member ->
                if (member.uid == session.profile.uid) member.copy(avatar = avatar) else member
            }
            _uiState.update { state ->
                state.copy(
                    session = session.copy(
                        profile = session.profile.copy(avatar = avatar),
                        house = session.house.copy(members = members),
                    ),
                )
            }
        }
    }

    fun createInvite() {
        val session = readySession() ?: return
        runAction("Convite válido por 7 dias.") {
            val code = repository.createInvite(session.house, session.profile.uid)
            _uiState.update { it.copy(inviteCode = code) }
        }
    }

    fun loadFriendCode() {
        val session = readySession() ?: return
        if (_uiState.value.friendCode != null) return
        runAction {
            val code = repository.getOrCreateFriendCode(session.house.id)
            _uiState.update { it.copy(friendCode = code) }
        }
    }

    fun connectFriend(code: String) {
        val session = readySession() ?: return
        runAction("Casa amiga ligada.") { repository.connectFriend(session.house, code) }
    }

    fun removeFriend(id: String) {
        val session = readySession() ?: return
        runAction("Casa amiga removida.") {
            repository.deleteExtra(session.house.id, "friends", id)
        }
    }

    fun sendMessage(to: String, message: String) {
        val session = readySession() ?: return
        runAction("Mensagem enviada.") {
            repository.sendMessage(to, session.profile.name, message)
        }
    }

    fun refreshWeather() {
        val current = currentWeather()
        updateWeather { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            setWeather(repository.loadWeather(current.activeLocation, current.preferences))
        }
    }

    fun searchWeatherLocations(query: String) {
        val cleanQuery = query.trim()
        if (cleanQuery.length < 2) {
            updateWeather { it.copy(searchResults = emptyList(), searching = false) }
            return
        }

        updateWeather { it.copy(searching = true, error = null) }
        viewModelScope.launch {
            runCatching { repository.searchWeatherLocations(cleanQuery) }
                .onSuccess { results ->
                    updateWeather { it.copy(searchResults = results, searching = false) }
                }
                .onFailure {
                    updateWeather {
                        it.copy(
                            searching = false,
                            error = "Não foi possível pesquisar localizações.",
                        )
                    }
                }
        }
    }

    fun selectWeatherLocation(location: WeatherLocation) {
        loadWeatherLocation(location)
    }

    fun selectFavoriteWeatherLocation(location: WeatherLocation) {
        val session = readySession() ?: return
        val current = currentWeather()
        val preferences = current.preferences.copy(
            defaultMode = "favorite",
            defaultFavoriteId = location.id,
        )

        viewModelScope.launch {
            repository.saveWeatherPreferences(session.profile.uid, preferences)
            setWeather(repository.loadWeather(location, preferences))
        }
    }

    fun addWeatherFavorite(location: WeatherLocation) {
        val session = readySession() ?: return
        val current = currentWeather()
        val preferences = current.preferences.withFavorite(location)

        if (preferences == current.preferences && preferences.favorites.none { it.id == location.id }) {
            return showError("Podes guardar até 10 localizações favoritas.")
        }

        viewModelScope.launch {
            repository.saveWeatherPreferences(session.profile.uid, preferences)
            updateWeather { it.copy(preferences = preferences) }
        }
    }

    fun removeWeatherFavorite(id: String) {
        val session = readySession() ?: return
        val current = currentWeather()
        val preferences = current.preferences.withoutFavorite(id)
        val nextLocation = if (current.activeLocation.id == id) {
            preferences.resolvedLocation()
        } else {
            current.activeLocation
        }

        viewModelScope.launch {
            repository.saveWeatherPreferences(session.profile.uid, preferences)
            setWeather(repository.loadWeather(nextLocation, preferences))
        }
    }

    fun useDefaultWeatherLocation() {
        val session = readySession() ?: return
        val current = currentWeather()
        val preferences = current.preferences.copy(
            defaultMode = "fallback",
            defaultFavoriteId = null,
        )

        viewModelScope.launch {
            repository.saveWeatherPreferences(session.profile.uid, preferences)
            setWeather(
                repository.loadWeather(
                    location = preferences.resolvedLocation(),
                    preferences = preferences,
                ),
            )
        }
    }

    fun useCurrentWeatherLocation(latitude: Double, longitude: Double) {
        val session = readySession() ?: return
        val current = currentWeather()
        val location = WeatherLocation(
            id = "current",
            latitude = latitude,
            longitude = longitude,
            name = "Localização atual",
            displayName = "Localização atual",
            source = "auto",
            provider = "current",
        )
        val preferences = current.preferences.copy(
            defaultMode = "current",
            defaultFavoriteId = null,
        )

        viewModelScope.launch {
            repository.saveWeatherPreferences(session.profile.uid, preferences)
            setWeather(repository.loadWeather(location, preferences))
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun clearNotice() {
        _uiState.update { it.copy(notice = null) }
    }

    private fun runOperation(operation: suspend () -> SessionState) {
        viewModelScope.launch {
            _uiState.update { it.copy(working = true, error = null, notice = null) }
            runCatching { operation() }
                .onSuccess(::applySession)
                .onFailure { error ->
                    _uiState.update { state ->
                        state.copy(
                            session = if (repository.hasAuthenticatedUser) state.session else SessionState.SignedOut,
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
                .onSuccess {
                    _uiState.update { state -> state.copy(working = false, notice = success) }
                }
                .onFailure { error ->
                    _uiState.update { state ->
                        state.copy(
                            working = false,
                            error = FirebaseCasaRepository.friendlyError(error),
                        )
                    }
                }
        }
    }

    private fun applySession(session: SessionState) {
        _uiState.value = CasaUiState(session = session)
        if (session is SessionState.Ready) {
            observeDashboard(session)
        }
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
            result.onSuccess { value ->
                _uiState.update { it.copy(dashboard = it.dashboard.copy(habitChecks = value)) }
            }.onFailure(::showRealtimeError)
        }
        listeners += repository.observeExpenses(houseId) { result ->
            result.onSuccess { value ->
                _uiState.update { it.copy(dashboard = it.dashboard.copy(expenses = value)) }
            }.onFailure(::showRealtimeError)
        }
        listeners += repository.observeIncomes(houseId) { result ->
            result.onSuccess { value ->
                _uiState.update { it.copy(dashboard = it.dashboard.copy(incomes = value)) }
            }.onFailure(::showRealtimeError)
        }
        listeners += repository.observeSavings(houseId) { result ->
            result.onSuccess { value ->
                _uiState.update { it.copy(dashboard = it.dashboard.copy(savingsGoals = value)) }
            }.onFailure(::showRealtimeError)
        }
        listeners += repository.observeEvents(houseId) { result ->
            result.onSuccess { value ->
                _uiState.update { it.copy(dashboard = it.dashboard.copy(events = value)) }
                syncEventItemListeners(houseId, value)
            }.onFailure(::showRealtimeError)
        }
        listeners += repository.observeFriends(houseId) { result ->
            result.onSuccess { value ->
                _uiState.update { it.copy(dashboard = it.dashboard.copy(friends = value)) }
                refreshBirthdays(session, value)
            }.onFailure(::showRealtimeError)
        }

        initializeAvatar(session)
        initializeWeather(session.profile.uid)
        refreshBirthdays(session, emptyList())
    }

    private fun initializeAvatar(session: SessionState.Ready) {
        viewModelScope.launch {
            val avatar = runCatching {
                avatarRepository.migrateLegacyAvatarIfNeeded(session.profile, session.house)
            }.getOrDefault(session.profile.avatar.takeIf(String::isNotBlank) ?: DefaultAvatarEmoji)

            if (avatar == session.profile.avatar) return@launch

            val members = session.house.members.map { member ->
                if (member.uid == session.profile.uid) member.copy(avatar = avatar) else member
            }
            _uiState.update { state ->
                state.copy(
                    session = session.copy(
                        profile = session.profile.copy(avatar = avatar),
                        house = session.house.copy(members = members),
                    ),
                )
            }
        }
    }

    private fun initializeWeather(userId: String) {
        viewModelScope.launch {
            val preferences = runCatching {
                repository.loadWeatherPreferences(userId)
            }.getOrDefault(WeatherPreferences())
            setWeather(repository.loadWeather(preferences.resolvedLocation(), preferences))
        }
    }

    private fun loadWeatherLocation(location: WeatherLocation) {
        val current = currentWeather()
        updateWeather {
            it.copy(
                activeLocation = location,
                loading = true,
                error = null,
            )
        }
        viewModelScope.launch {
            setWeather(repository.loadWeather(location, current.preferences))
        }
    }

    private fun refreshBirthdays(session: SessionState.Ready, friends: List<FriendHouse>) {
        viewModelScope.launch {
            val birthdays = repository.loadBirthdays(session.house, friends)
            _uiState.update { it.copy(dashboard = it.dashboard.copy(birthdays = birthdays)) }
        }
    }

    private fun currentWeather(): WeatherState = _uiState.value.dashboard.weather

    private fun setWeather(weather: WeatherState) {
        _uiState.update { it.copy(dashboard = it.dashboard.copy(weather = weather)) }
    }

    private fun updateWeather(transform: (WeatherState) -> WeatherState) {
        _uiState.update { state ->
            state.copy(
                dashboard = state.dashboard.copy(
                    weather = transform(state.dashboard.weather),
                ),
            )
        }
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
            _uiState.update { state ->
                state.copy(
                    dashboard = state.dashboard.copy(
                        eventItems = state.dashboard.eventItems - staleId,
                    ),
                )
            }
        }

        events.filterNot { eventItemListeners.containsKey(it.id) }.forEach { event ->
            eventItemListeners[event.id] = repository.observeEventItems(houseId, event.id) { result ->
                result.onSuccess { items ->
                    _uiState.update { state ->
                        state.copy(
                            dashboard = state.dashboard.copy(
                                eventItems = state.dashboard.eventItems + (event.id to items),
                            ),
                        )
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
            if (state.error != null) {
                state
            } else {
                state.copy(error = FirebaseCasaRepository.friendlyError(error))
            }
        }
    }

    private fun String.parseAmount(): Double? =
        replace(',', '.').toDoubleOrNull()?.takeIf { it > 0 }

    override fun onCleared() {
        stopListeners()
        super.onCleared()
    }
}
