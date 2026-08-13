package com.findmucker.casa

import android.content.Intent
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters

enum class DashboardTab(val label: String, val emoji: String) {
    HOME("Início", "✨"),
    SHOPPING("Compras", "🛒"),
    SMALL("Coisinhas", "🪄"),
    PROJECTS("Projetos", "🏡"),
    HABITS("Rotinas", "🧘"),
    EXPENSES("Finanças", "💰"),
    CALENDAR("Calendário", "🗓️"),
    EVENTS("Eventos", "🎉"),
    WEATHER("Tempo", "🌤️");

    fun section(): HouseSection? = when (this) {
        SHOPPING -> HouseSection.SHOPPING
        SMALL -> HouseSection.SMALL_PRIORITIES
        PROJECTS -> HouseSection.PROJECTS
        HABITS -> HouseSection.HABITS
        else -> null
    }
}

enum class DashboardOverlay {
    MENU, SEARCH, PROFILE, HISTORY, INVITE, MEMBERS, FRIENDS, MESSAGE, HELP,
}

@Composable
fun HouseWelcomeScreen(
    profile: UserProfile,
    house: House,
    state: CasaUiState,
    onAdd: (HouseSection, String) -> Unit,
    onAddDetailed: (HouseSection, ItemDraft) -> Unit,
    onToggle: (HouseSection, HouseItem) -> Unit,
    onDelete: (HouseSection, String) -> Unit,
    onUpdateItem: (HouseSection, String, Map<String, Any?>) -> Unit,
    onMoveItem: (HouseSection, HouseItem, HouseItem) -> Unit,
    onAddSubtask: (HouseItem, String) -> Unit,
    onToggleSubtask: (HouseItem, Subtask) -> Unit,
    onDeleteSubtask: (HouseItem, String) -> Unit,
    onAddExpense: (String, String, String, String) -> Unit,
    onAddIncome: (String, String, String, Boolean) -> Unit,
    onAddSavings: (String, String, String) -> Unit,
    onDepositSavings: (SavingsGoal, String) -> Unit,
    onDeleteExtra: (String, String) -> Unit,
    onAddEvent: (String, String, String) -> Unit,
    onToggleEvent: (CasaEvent) -> Unit,
    onUpdateEvent: (String, Map<String, Any?>) -> Unit,
    onAddEventItem: (String, String, String, String?) -> Unit,
    onToggleEventItem: (String, EventItem) -> Unit,
    onAssignEventItem: (String, String, String) -> Unit,
    onRenameEventItem: (String, String, String) -> Unit,
    onDeleteEventItem: (String, String) -> Unit,
    onCloneEvent: (CasaEvent) -> Unit,
    onShareEvent: (CasaEvent) -> Unit,
    onConsumeShareUrl: () -> Unit,
    onRenameHouse: (String) -> Unit,
    onUpdateProfile: (String, String?) -> Unit,
    onEquipItem: (String, LootSlot) -> Unit,
    onUnequipItem: (LootSlot) -> Unit,
    onSaveAvatar: (AvatarConfig) -> Unit,
    onOpenLootBox: () -> Unit,
    onCreateInvite: () -> Unit,
    onLoadFriendCode: () -> Unit,
    onConnectFriend: (String) -> Unit,
    onRemoveFriend: (String) -> Unit,
    onSendMessage: (String, String) -> Unit,
    onRefreshWeather: () -> Unit,
    onSearchWeather: (String) -> Unit,
    onSelectWeather: (WeatherLocation) -> Unit,
    onSelectFavoriteWeather: (WeatherLocation) -> Unit,
    onAddWeatherFavorite: (WeatherLocation) -> Unit,
    onRemoveWeatherFavorite: (String) -> Unit,
    onUseDefaultWeather: () -> Unit,
    onUseCurrentWeather: (Double, Double) -> Unit,
    onSignOut: () -> Unit,
    onClearError: () -> Unit,
    onClearNotice: () -> Unit,
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableStateOf(DashboardTab.HOME) }
    var overlay by remember { mutableStateOf<DashboardOverlay?>(null) }
    val navScroll = rememberScrollState()

    LaunchedEffect(state.shareUrl) {
        val url = state.shareUrl ?: return@LaunchedEffect
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "Evento Casinha")
            putExtra(Intent.EXTRA_TEXT, url)
        }
        context.startActivity(Intent.createChooser(sendIntent, "Partilhar evento"))
        onConsumeShareUrl()
    }

    BackHandler(enabled = overlay != null || selectedTab != DashboardTab.HOME) {
        if (overlay != null) overlay = null else selectedTab = DashboardTab.HOME
    }

    LaunchedEffect(selectedTab) {
        val index = DashboardTab.entries.indexOf(selectedTab)
        navScroll.animateScrollTo((index * 56 * navScroll.maxValue / (DashboardTab.entries.size * 56).coerceAtLeast(1)).coerceAtMost(navScroll.maxValue))
    }

    Column(modifier = Modifier.fillMaxSize()) {
        CompactHeader(
            houseName = house.name,
            profile = profile,
            onSearch = { overlay = DashboardOverlay.SEARCH },
            onMenu = { overlay = DashboardOverlay.MENU },
            onProfile = { overlay = DashboardOverlay.PROFILE },
        )

        var horizontalDrag by remember { mutableFloatStateOf(0f) }
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .pointerInput(selectedTab, overlay) {
                    if (overlay == null) {
                        detectHorizontalDragGestures(
                            onDragStart = { horizontalDrag = 0f },
                            onHorizontalDrag = { _, amount -> horizontalDrag += amount },
                            onDragEnd = {
                                val tabs = DashboardTab.entries
                                val index = tabs.indexOf(selectedTab)
                                if (horizontalDrag < -90f && index < tabs.lastIndex) selectedTab = tabs[index + 1]
                                if (horizontalDrag > 90f && index > 0) selectedTab = tabs[index - 1]
                                horizontalDrag = 0f
                            },
                        )
                    }
                },
        ) {
            when (selectedTab) {
                DashboardTab.HOME -> HomeDashboard(
                    dashboard = state.dashboard,
                    onNavigate = { selectedTab = it },
                )
                DashboardTab.SHOPPING,
                DashboardTab.SMALL,
                DashboardTab.PROJECTS,
                DashboardTab.HABITS -> {
                    val section = requireNotNull(selectedTab.section())
                    DomainCollectionScreen(
                        section = section,
                        items = state.dashboard.forSection(section),
                        loading = section in state.dashboard.loading,
                        working = state.working,
                        error = state.error,
                        notice = state.notice,
                        onAdd = { onAdd(section, it) },
                        onAddDetailed = { onAddDetailed(section, it) },
                        onToggle = { onToggle(section, it) },
                        onDelete = { onDelete(section, it) },
                        onUpdate = { itemId, values -> onUpdateItem(section, itemId, values) },
                        onMove = { item, before -> onMoveItem(section, item, before) },
                        onAddSubtask = onAddSubtask,
                        onToggleSubtask = onToggleSubtask,
                        onDeleteSubtask = onDeleteSubtask,
                        members = house.members,
                        onClearFeedback = { onClearError(); onClearNotice() },
                    )
                }
                DashboardTab.EXPENSES -> FinanceScreen(
                    dashboard = state.dashboard,
                    house = house,
                    working = state.working,
                    error = state.error,
                    notice = state.notice,
                    onAddExpense = onAddExpense,
                    onAddIncome = onAddIncome,
                    onAddSavings = onAddSavings,
                    onDeposit = onDepositSavings,
                    onDelete = onDeleteExtra,
                )
                DashboardTab.CALENDAR -> CalendarScreen(dashboard = state.dashboard)
                DashboardTab.EVENTS -> EventsScreen(
                    events = state.dashboard.events,
                    eventItems = state.dashboard.eventItems,
                    weather = state.dashboard.weather,
                    working = state.working,
                    error = state.error,
                    notice = state.notice,
                    onAdd = onAddEvent,
                    onToggle = onToggleEvent,
                    onDelete = { onDeleteExtra("events", it) },
                    onUpdate = onUpdateEvent,
                    onAddItem = onAddEventItem,
                    onToggleItem = onToggleEventItem,
                    onAssignItem = onAssignEventItem,
                    onRenameItem = onRenameEventItem,
                    onDeleteItem = onDeleteEventItem,
                    onClone = onCloneEvent,
                    onShare = onShareEvent,
                )
                DashboardTab.WEATHER -> WeatherScreen(
                    weather = state.dashboard.weather,
                    onRefresh = onRefreshWeather,
                    onSearch = onSearchWeather,
                    onSelect = onSelectWeather,
                    onSelectFavorite = onSelectFavoriteWeather,
                    onAddFavorite = onAddWeatherFavorite,
                    onRemoveFavorite = onRemoveWeatherFavorite,
                    onUseDefault = onUseDefaultWeather,
                    onUseCurrent = onUseCurrentWeather,
                )
            }
        }

        BottomTabs(
            selected = selectedTab,
            panelOpen = overlay != null,
            scrollState = navScroll,
            onSelect = {
                selectedTab = it
                overlay = null
            },
        )
    }

    if (overlay != null) {
        DashboardOverlayScreen(
            overlay = requireNotNull(overlay),
            selectedTab = selectedTab,
            profile = profile,
            house = house,
            state = state,
            onClose = { overlay = null },
            onOpen = { overlay = it },
            onNavigate = {
                selectedTab = it
                overlay = null
            },
            onRenameHouse = onRenameHouse,
            onUpdateProfile = onUpdateProfile,
            onEquipItem = onEquipItem,
            onUnequipItem = onUnequipItem,
            onSaveAvatar = onSaveAvatar,
            onOpenLootBox = onOpenLootBox,
            onCreateInvite = onCreateInvite,
            onLoadFriendCode = onLoadFriendCode,
            onConnectFriend = onConnectFriend,
            onRemoveFriend = onRemoveFriend,
            onSendMessage = onSendMessage,
            onSignOut = onSignOut,
        )
    }
}

@Composable
private fun CompactHeader(
    houseName: String,
    profile: UserProfile,
    onSearch: () -> Unit,
    onMenu: () -> Unit,
    onProfile: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.55f))
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Surface(
            modifier = Modifier.size(36.dp).clickable(onClick = onSearch),
            shape = CircleShape,
            color = CasinhaPalette.Pink50,
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(Icons.Rounded.Search, contentDescription = "Pesquisar", tint = CasinhaPalette.Pink400, modifier = Modifier.size(19.dp))
            }
        }
        Text(
            text = "🏡 $houseName",
            modifier = Modifier.weight(1f).clickable(onClick = onMenu),
            color = CasinhaPalette.Rose400,
            fontWeight = FontWeight.Bold,
            fontSize = 17.sp,
            textAlign = TextAlign.Center,
            maxLines = 1,
        )
        Surface(
            modifier = Modifier.size(36.dp).clickable(onClick = onProfile),
            shape = CircleShape,
            color = CasinhaPalette.Pink100.copy(alpha = 0.72f),
            border = BorderStroke(1.dp, CasinhaPalette.Pink200.copy(alpha = 0.7f)),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(profile.avatar.ifBlank { "👤" }, fontSize = 20.sp)
            }
        }
    }
}

@Composable
private fun BottomTabs(
    selected: DashboardTab,
    panelOpen: Boolean,
    scrollState: androidx.compose.foundation.ScrollState,
    onSelect: (DashboardTab) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.66f))
            .horizontalScroll(scrollState),
    ) {
        DashboardTab.entries.forEach { tab ->
            val active = tab == selected && !panelOpen
            Column(
                modifier = Modifier
                    .width(64.dp)
                    .clickable { onSelect(tab) }
                    .padding(horizontal = 4.dp, vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(modifier = Modifier.height(3.dp).width(32.dp).clip(CircleShape).background(
                    if (active) Brush.horizontalGradient(listOf(CasinhaPalette.Pink400, CasinhaPalette.Rose400))
                    else Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent)),
                ))
                Text(tab.emoji, fontSize = if (active) 20.sp else 18.sp, modifier = Modifier.padding(top = 4.dp))
                Text(
                    tab.label,
                    color = if (active) CasinhaPalette.Rose500 else Color(0xFF9CA3AF),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                )
            }
        }
    }
}

@Composable
private fun HomeDashboard(dashboard: DashboardState, onNavigate: (DashboardTab) -> Unit) {
    val today = todayKey()
    val month = today.take(7)
    val weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toString()
    val shopping = dashboard.forSection(HouseSection.SHOPPING)
    val coisinhas = dashboard.forSection(HouseSection.SMALL_PRIORITIES)
    val projects = dashboard.forSection(HouseSection.PROJECTS)
    val habits = dashboard.forSection(HouseSection.HABITS)
    val shoppingPending = shopping.count { !it.done }
    val shoppingDone = shopping.count { it.done }
    val coisinhasPending = coisinhas.count { !it.done }
    val coisinhasDone = coisinhas.count { it.done }
    val projectsInProgress = projects.count { it.status == "em progresso" }
    val projectsDone = projects.count { it.status == "concluido" }
    val todayChecks = dashboard.habitChecks.count { it.date == today }.coerceAtMost(habits.size)
    val monthExpenses = dashboard.expenses.filter { it.date.startsWith(month) }.sumOf { it.amount }
    val weeklyDone = (shopping + coisinhas).count { it.done && (it.completedAt ?: "") >= weekStart }
    val weeklyTotal = (weeklyDone + shoppingPending + coisinhasPending).coerceAtLeast(1)
    val weeklyProgress = (weeklyDone.toFloat() / weeklyTotal).coerceIn(0f, 1f)
    val weeklyPct = (weeklyProgress * 100).toInt()
    val urgent = shopping.count { !it.done && it.urgent }
    val maxStreak = habits.maxOfOrNull { it.streak } ?: 0
    val habitsComplete = habits.isNotEmpty() && todayChecks >= habits.size
    val hour = java.time.LocalTime.now().hour
    val moment = when (hour) {
        in 6..11 -> "esta manhã?"
        in 12..18 -> "esta tarde?"
        else -> "esta noite?"
    }
    val motivation = when {
        weeklyPct >= 80 -> "🏆 Incrível!"
        weeklyPct >= 60 -> "💪 Bom trabalho!"
        weeklyPct >= 30 -> "🚀 Vamos a isso!"
        else -> "🌱 Um passo de cada vez"
    }

    androidx.compose.foundation.lazy.LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 14.dp),
    ) {
        item {
            Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 18.dp)) {
                Row(verticalAlignment = Alignment.Top) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("O que fazemos $moment", color = CasinhaPalette.Purple400, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Text(motivation, color = CasinhaPalette.Rose600, fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 2.dp))
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("$weeklyPct%", color = CasinhaPalette.Rose500, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        Text("esta semana", color = CasinhaPalette.Purple400, fontSize = 9.sp)
                    }
                }
                CasinhaProgress(
                    progress = weeklyProgress,
                    color = CasinhaPalette.Pink400,
                    modifier = Modifier.padding(top = 12.dp),
                    height = 12,
                )
                Text("$weeklyDone concluídos esta semana", color = CasinhaPalette.Purple400, fontSize = 10.sp, modifier = Modifier.padding(top = 5.dp))
            }
        }

        if (urgent > 0) item {
            Surface(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 2.dp).clickable { onNavigate(DashboardTab.SHOPPING) },
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFFFFF1F2),
                border = BorderStroke(1.dp, CasinhaPalette.Rose200.copy(alpha = 0.6f)),
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("🚨 Urgente", color = CasinhaPalette.Red500, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text("$urgent ${if (urgent == 1) "compra precisa" else "compras precisam"} de atenção", color = CasinhaPalette.Rose600, fontSize = 11.sp)
                }
            }
        }

        item {
            Surface(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp).clickable { onNavigate(DashboardTab.HABITS) },
                shape = RoundedCornerShape(12.dp),
                color = if (habitsComplete) CasinhaPalette.Emerald50 else CasinhaPalette.Purple50,
                border = BorderStroke(1.dp, if (habitsComplete) CasinhaPalette.Emerald200.copy(alpha = 0.6f) else CasinhaPalette.Purple200.copy(alpha = 0.45f)),
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(if (habitsComplete) "✅" else "🧘", fontSize = 22.sp)
                        Column(modifier = Modifier.weight(1f).padding(start = 9.dp)) {
                            Text(if (habitsComplete) "Rotinas completas!" else "Rotinas de hoje", color = if (habitsComplete) CasinhaPalette.Emerald600 else CasinhaPalette.Purple600, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Text("$todayChecks/${habits.size} feitas", color = CasinhaPalette.MutedInk, fontSize = 10.sp)
                        }
                        if (maxStreak > 0) Text("🔥 $maxStreak", color = CasinhaPalette.Amber500, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                    if (habits.isNotEmpty()) CasinhaProgress(
                        progress = todayChecks.toFloat() / habits.size,
                        color = CasinhaPalette.Emerald400,
                        modifier = Modifier.padding(top = 8.dp),
                        trackColor = Color(0xFFE5E7EB),
                    )
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                HomeStatCard(
                    modifier = Modifier.weight(1f), emoji = "🛒", value = shoppingPending.toString(),
                    label = "compras por fazer", progress = ratio(shoppingDone, shopping.size),
                    colors = listOf(CasinhaPalette.Pink50, CasinhaPalette.Rose100), accent = CasinhaPalette.Pink400,
                    onClick = { onNavigate(DashboardTab.SHOPPING) },
                )
                HomeStatCard(
                    modifier = Modifier.weight(1f), emoji = "🪄", value = coisinhasPending.toString(),
                    label = "coisinhas por fazer", progress = ratio(coisinhasDone, coisinhas.size),
                    colors = listOf(CasinhaPalette.Purple50, Color(0xFFE0E7FF)), accent = CasinhaPalette.Purple400,
                    onClick = { onNavigate(DashboardTab.SMALL) },
                )
            }
        }
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                HomeStatCard(
                    modifier = Modifier.weight(1f), emoji = "🏡", value = projectsInProgress.toString(),
                    label = "projetos em curso", detail = if (projectsDone > 0) "✓ $projectsDone concluídos" else null,
                    colors = listOf(Color(0xFFEFF6FF), Color(0xFFCFFAFE)), accent = CasinhaPalette.Blue400,
                    onClick = { onNavigate(DashboardTab.PROJECTS) },
                )
                HomeStatCard(
                    modifier = Modifier.weight(1f), emoji = "💰", value = monthExpenses.asEuro(),
                    label = "gastos este mês", colors = listOf(CasinhaPalette.Emerald50, Color(0xFFCCFBF1)),
                    accent = CasinhaPalette.Emerald500, onClick = { onNavigate(DashboardTab.EXPENSES) },
                )
            }
        }
    }
}

@Composable
private fun HomeStatCard(
    modifier: Modifier,
    emoji: String,
    value: String,
    label: String,
    colors: List<Color>,
    accent: Color,
    progress: Float? = null,
    detail: String? = null,
    onClick: () -> Unit,
) {
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = Color.Transparent,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.25f)),
    ) {
        Column(modifier = Modifier.background(Brush.linearGradient(colors)).padding(14.dp)) {
            Text(emoji, fontSize = 24.sp)
            Text(value, color = CasinhaPalette.Ink, fontSize = if (value.length > 6) 18.sp else 21.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 6.dp))
            Text(label, color = CasinhaPalette.MutedInk, fontSize = 11.sp)
            if (progress != null) CasinhaProgress(progress, accent, modifier = Modifier.padding(top = 8.dp), height = 4)
            if (detail != null) Text(detail, color = CasinhaPalette.Emerald500, fontSize = 9.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(top = 5.dp))
        }
    }
}

private fun ratio(done: Int, total: Int): Float = if (total <= 0) 0f else done.toFloat() / total
