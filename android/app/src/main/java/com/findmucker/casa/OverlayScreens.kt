package com.findmucker.casa

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun DashboardOverlayScreen(
    overlay: DashboardOverlay,
    selectedTab: DashboardTab,
    profile: UserProfile,
    house: House,
    state: CasaUiState,
    onClose: () -> Unit,
    onOpen: (DashboardOverlay) -> Unit,
    onNavigate: (DashboardTab) -> Unit,
    onRenameHouse: (String) -> Unit,
    onUpdateProfile: (String, String?) -> Unit,
    onEquipItem: (String, LootSlot) -> Unit,
    onUnequipItem: (LootSlot) -> Unit,
    onSaveAvatar: (AvatarConfig) -> Unit,
    onCreateInvite: () -> Unit,
    onLoadFriendCode: () -> Unit,
    onConnectFriend: (String) -> Unit,
    onRemoveFriend: (String) -> Unit,
    onSendMessage: (String, String) -> Unit,
    onSignOut: () -> Unit,
) {
    Surface(modifier = Modifier.fillMaxSize(), color = Color.Transparent) {
        Box(modifier = Modifier.fillMaxSize().background(CasinhaBackgroundBrush)) {
            when (overlay) {
                DashboardOverlay.MENU -> MainMenuOverlay(
                    selectedTab, profile, house, state.dashboard, onClose, onOpen, onNavigate,
                    onRenameHouse, onSignOut,
                )
                DashboardOverlay.SEARCH -> SearchOverlay(state.dashboard, onClose, onNavigate)
                DashboardOverlay.PROFILE -> ProfileOverlay(
                    profile, state.dashboard, state.working, state.error, state.notice,
                    onClose, onUpdateProfile, onSaveAvatar,
                )
                DashboardOverlay.HISTORY -> HistoryOverlay(state.dashboard, onClose)
                DashboardOverlay.INVITE -> InviteOverlay(state.inviteCode, state.working, state.error, state.notice, onClose, onCreateInvite)
                DashboardOverlay.MEMBERS -> MembersOverlay(profile, house, state.dashboard, onClose, onOpen)
                DashboardOverlay.FRIENDS -> FriendsOverlay(state.friendCode, state.dashboard.friends, state.working, state.error, state.notice, onClose, onLoadFriendCode, onConnectFriend, onRemoveFriend)
                DashboardOverlay.MESSAGE -> MessageOverlay(profile, house, state.working, state.error, state.notice, onClose, onSendMessage)
                DashboardOverlay.HELP -> HelpOverlay(onClose)
            }
        }
    }
}

private enum class MenuMode { ROOT, HOUSE, SETTINGS }

@Composable
private fun MainMenuOverlay(
    selectedTab: DashboardTab,
    profile: UserProfile,
    house: House,
    dashboard: DashboardState,
    onClose: () -> Unit,
    onOpen: (DashboardOverlay) -> Unit,
    onNavigate: (DashboardTab) -> Unit,
    onRenameHouse: (String) -> Unit,
    onSignOut: () -> Unit,
) {
    var mode by remember { mutableStateOf(MenuMode.ROOT) }
    var renaming by remember { mutableStateOf(false) }
    var houseName by remember(house.name) { mutableStateOf(house.name) }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (mode != MenuMode.ROOT) IconButton(onClick = { mode = MenuMode.ROOT }) { Icon(Icons.Rounded.ArrowBack, "Voltar", tint = CasinhaPalette.Rose400) }
                Text(
                    when (mode) { MenuMode.ROOT -> house.name; MenuMode.HOUSE -> "Casa"; MenuMode.SETTINGS -> "Definições" },
                    modifier = Modifier.weight(1f), textAlign = TextAlign.Center,
                    color = CasinhaPalette.Rose500, fontSize = 18.sp, fontWeight = FontWeight.Bold,
                )
                IconButton(onClick = onClose) { Icon(Icons.Rounded.Close, "Fechar", tint = CasinhaPalette.Rose400) }
            }
        }
        if (mode == MenuMode.ROOT) {
            item {
                GlassCard(
                    modifier = Modifier.fillMaxWidth().clickable { onOpen(DashboardOverlay.MEMBERS) },
                    color = Color.White.copy(alpha = 0.88f),
                    contentPadding = PaddingValues(18.dp),
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("👥  Membros  ›", color = CasinhaPalette.Rose500, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Row(modifier = Modifier.fillMaxWidth().padding(top = 14.dp), horizontalArrangement = Arrangement.Center) {
                            house.members.forEach { member ->
                                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(horizontal = 10.dp)) {
                                    Surface(shape = CircleShape, color = CasinhaPalette.Pink100, border = BorderStroke(1.dp, CasinhaPalette.Pink200)) {
                                        Box(modifier = Modifier.size(52.dp), contentAlignment = Alignment.Center) { Text(member.avatar.ifBlank { "👤" }, fontSize = 27.sp) }
                                    }
                                    Text(member.name, color = CasinhaPalette.Rose700, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 5.dp))
                                }
                            }
                        }
                    }
                }
            }
            item { OverlaySectionLabel("NAVEGAR") }
            items(DashboardTab.entries.chunked(5)) { tabs ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    tabs.forEach { tab ->
                        OverlayTile(
                            modifier = Modifier.weight(1f), emoji = tab.emoji, label = tab.label,
                            selected = selectedTab == tab,
                        ) { onNavigate(tab) }
                    }
                    repeat(5 - tabs.size) { Spacer(Modifier.weight(1f)) }
                }
            }
            item {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 28.dp, vertical = 10.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    OverlayTile(Modifier.weight(1f), "🏠", "Casa", false) { mode = MenuMode.HOUSE }
                    OverlayTile(Modifier.weight(1f), "⚙️", "Definições", false) { mode = MenuMode.SETTINGS }
                }
            }
        } else if (mode == MenuMode.HOUSE) {
            item { OverlaySectionLabel("CASA") }
            item {
                OverlayGrid(
                    listOf(
                        Triple("🔗", "Convidar", DashboardOverlay.INVITE),
                        Triple("👥", "Membros", DashboardOverlay.MEMBERS),
                        Triple("🏘️", "Vizinhos", DashboardOverlay.FRIENDS),
                        Triple("💌", "Mensagem", DashboardOverlay.MESSAGE),
                    ),
                    onOpen,
                )
            }
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Column {
                        Text("✏️ Renomear casa", color = CasinhaPalette.Rose600, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                        if (renaming) {
                            Row(modifier = Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                                CasinhaInput(houseName, { houseName = it }, "Nome da casa", Modifier.weight(1f))
                                GradientActionButton("Guardar", { onRenameHouse(houseName); renaming = false })
                            }
                        } else TextButton(onClick = { renaming = true }) { Text(house.name, color = CasinhaPalette.Pink400) }
                    }
                }
            }
        } else {
            item { OverlaySectionLabel("DEFINIÇÕES") }
            item {
                OverlayGrid(
                    listOf(
                        Triple("📜", "Histórico", DashboardOverlay.HISTORY),
                        Triple("❓", "Ajuda", DashboardOverlay.HELP),
                        Triple("👤", "Perfil", DashboardOverlay.PROFILE),
                        Triple("💌", "Mensagem", DashboardOverlay.MESSAGE),
                    ),
                    onOpen,
                )
            }
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🌐 Idioma", color = CasinhaPalette.Rose600, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, modifier = Modifier.weight(1f))
                        Surface(shape = CircleShape, color = CasinhaPalette.Rose400) { Text("🇵🇹 PT", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 9.sp, modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp)) }
                        Surface(shape = CircleShape, color = Color.Transparent, modifier = Modifier.padding(start = 4.dp)) { Text("🇬🇧 EN", color = CasinhaPalette.Pink400, fontWeight = FontWeight.Bold, fontSize = 9.sp, modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp)) }
                    }
                }
            }
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth().clickable(onClick = onSignOut),
                    shape = RoundedCornerShape(16.dp), color = CasinhaPalette.Rose50,
                    border = BorderStroke(1.dp, CasinhaPalette.Rose200.copy(alpha = 0.6f)),
                ) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                        Icon(Icons.AutoMirrored.Rounded.Logout, "Sair", tint = CasinhaPalette.Red500, modifier = Modifier.size(18.dp))
                        Text("Sair", color = CasinhaPalette.Red500, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 7.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun SearchOverlay(dashboard: DashboardState, onClose: () -> Unit, onNavigate: (DashboardTab) -> Unit) {
    var query by remember { mutableStateOf("") }
    val results = remember(query, dashboard) {
        if (query.trim().length < 2) emptyList() else buildList {
            HouseSection.entries.forEach { section ->
                val tab = when (section) {
                    HouseSection.SHOPPING -> DashboardTab.SHOPPING
                    HouseSection.SMALL_PRIORITIES -> DashboardTab.SMALL
                    HouseSection.PROJECTS -> DashboardTab.PROJECTS
                    HouseSection.HABITS -> DashboardTab.HABITS
                }
                dashboard.forSection(section).filter { it.name.contains(query.trim(), ignoreCase = true) }
                    .forEach { add(SearchResult(section.emoji, it.name, section.title, tab)) }
            }
            dashboard.expenses.filter { it.name.contains(query.trim(), true) }.forEach { add(SearchResult("💰", it.name, it.amount.asEuro(), DashboardTab.EXPENSES)) }
            dashboard.events.filter { it.title.contains(query.trim(), true) }.forEach { add(SearchResult("🎉", it.title, it.date, DashboardTab.EVENTS)) }
        }.take(60)
    }
    Column(modifier = Modifier.fillMaxSize()) {
        OverlayTopBar("Pesquisar", onClose)
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            CasinhaInput(query, { query = it }, "Pesquisar em toda a casa...", Modifier.weight(1f))
            Icon(Icons.Rounded.Search, null, tint = CasinhaPalette.Pink400, modifier = Modifier.padding(start = 10.dp))
        }
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (query.length < 2) item { EmptyState("🔍", "Escreve pelo menos 2 letras") }
            else if (results.isEmpty()) item { EmptyState("🌸", "Não encontrei nada") }
            items(results) { result ->
                GlassCard(modifier = Modifier.fillMaxWidth().clickable { onNavigate(result.tab) }) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(result.emoji, fontSize = 21.sp)
                        Column(modifier = Modifier.weight(1f).padding(start = 10.dp)) {
                            Text(result.title, color = CasinhaPalette.Rose700, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text(result.detail, color = CasinhaPalette.Pink400, fontSize = 9.sp)
                        }
                        Text("›", color = CasinhaPalette.Pink300, fontSize = 20.sp)
                    }
                }
            }
        }
    }
}

private data class SearchResult(val emoji: String, val title: String, val detail: String, val tab: DashboardTab)

@Composable
private fun ProfileOverlay(
    profile: UserProfile,
    dashboard: DashboardState,
    working: Boolean,
    error: String?,
    notice: String?,
    onClose: () -> Unit,
    onUpdateProfile: (String, String?) -> Unit,
    onSaveAvatar: (AvatarConfig) -> Unit,
) {
    var name by remember(profile.name) { mutableStateOf(profile.name) }
    var birthDate by remember(profile.birthDate) { mutableStateOf(profile.birthDate.orEmpty()) }
    Column(modifier = Modifier.fillMaxSize()) {
        OverlayTopBar("Perfil", onClose)
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Column(
                    modifier = Modifier.fillMaxWidth().background(Color.White.copy(alpha = 0.42f)).padding(18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    AvatarCharacter(dashboard.gamification.avatar, modifier = Modifier.size(96.dp), compact = true)
                    Text(profile.name, color = CasinhaPalette.Rose700, fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.padding(top = 9.dp))
                    if (!profile.email.isNullOrBlank()) Text(profile.email.orEmpty(), color = CasinhaPalette.Pink400, fontSize = 10.sp, modifier = Modifier.padding(top = 2.dp))
                }
            }
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Dados pessoais", color = CasinhaPalette.Rose600, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        CasinhaInput(name, { name = it }, "Nome", Modifier.fillMaxWidth())
                        CasinhaInput(birthDate, { birthDate = it }, "Data de nascimento (AAAA-MM-DD)", Modifier.fillMaxWidth())
                        GradientActionButton(
                            "Guardar perfil",
                            { onUpdateProfile(name, birthDate.ifBlank { null }) },
                            Modifier.fillMaxWidth(),
                            enabled = name.isNotBlank() && !working,
                        )
                    }
                }
            }
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    AvatarEditor(dashboard.gamification.avatar, working, onSaveAvatar)
                }
            }
            item { FeedbackBanner(error, notice) }
        }
    }
}

@Composable
private fun HistoryOverlay(dashboard: DashboardState, onClose: () -> Unit) {
    val history = remember(dashboard) {
        buildList {
            dashboard.forSection(HouseSection.SHOPPING).filter { it.done }.forEach { add(HistoryItem("🛒", it.name, "Compras", it.completedAt)) }
            dashboard.forSection(HouseSection.SMALL_PRIORITIES).filter { it.done }.forEach { add(HistoryItem("🪄", it.name, "Coisinhas", it.completedAt)) }
            dashboard.forSection(HouseSection.PROJECTS).filter { it.done }.forEach { add(HistoryItem("🏡", it.name, "Projetos", it.completedAt)) }
        }.sortedByDescending { it.date ?: "" }.take(50)
    }
    Column(modifier = Modifier.fillMaxSize()) {
        OverlayTopBar("📜 Histórico", onClose)
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Total" to history.size, "🛒" to dashboard.forSection(HouseSection.SHOPPING).count { it.done }, "🪄" to dashboard.forSection(HouseSection.SMALL_PRIORITIES).count { it.done }, "🏡" to dashboard.forSection(HouseSection.PROJECTS).count { it.done }).forEach { (label, value) ->
                GlassCard(modifier = Modifier.weight(1f), contentPadding = PaddingValues(9.dp)) { Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) { Text(value.toString(), color = CasinhaPalette.Rose600, fontWeight = FontWeight.Bold, fontSize = 17.sp); Text(label, color = CasinhaPalette.Pink400, fontSize = 9.sp) } }
            }
        }
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            if (history.isEmpty()) item { EmptyState("📜", "Nada completado ainda!") }
            items(history) { item -> GlassCard(modifier = Modifier.fillMaxWidth(), contentPadding = PaddingValues(horizontal = 12.dp, vertical = 9.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Text(item.emoji); Column(modifier = Modifier.weight(1f).padding(start = 10.dp)) { Text(item.name, color = CasinhaPalette.Rose700, fontSize = 11.sp); if (item.date != null) Text(item.date, color = CasinhaPalette.Pink400, fontSize = 9.sp) }; Text(item.type, color = CasinhaPalette.Pink300, fontSize = 9.sp) } } }
        }
    }
}

private data class HistoryItem(val emoji: String, val name: String, val type: String, val date: String?)

@Composable
private fun InviteOverlay(code: String?, working: Boolean, error: String?, notice: String?, onClose: () -> Unit, onCreate: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
        OverlayTopBar("Convidar membro", onClose)
        Spacer(Modifier.weight(1f))
        Text("🔗", fontSize = 52.sp)
        Text("Convidar membro", color = CasinhaPalette.Rose500, fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.padding(top = 12.dp))
        Text("Gera um código para alguém se juntar à tua casa", color = CasinhaPalette.Pink400, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp))
        if (code == null) GradientActionButton(if (working) "A gerar..." else "Gerar convite", onCreate, enabled = !working, modifier = Modifier.padding(top = 16.dp))
        else {
            Surface(shape = RoundedCornerShape(16.dp), color = Color.White, border = BorderStroke(1.dp, CasinhaPalette.Pink200), modifier = Modifier.padding(top = 18.dp)) { Text(code, color = CasinhaPalette.Rose600, fontSize = 26.sp, fontWeight = FontWeight.Bold, letterSpacing = 5.sp, modifier = Modifier.padding(horizontal = 28.dp, vertical = 15.dp)) }
            Text("Válido por 7 dias", color = CasinhaPalette.Pink400, fontSize = 10.sp, modifier = Modifier.padding(top = 8.dp))
        }
        FeedbackBanner(error, notice, Modifier.padding(24.dp))
        Spacer(Modifier.weight(1f))
    }
}

@Composable
private fun MembersOverlay(profile: UserProfile, house: House, dashboard: DashboardState, onClose: () -> Unit, onOpen: (DashboardOverlay) -> Unit) {
    var selectedMember by remember { mutableStateOf<HouseMember?>(null) }
    selectedMember?.let { member ->
        val game = if (member.uid == profile.uid) dashboard.gamification else dashboard.memberGamification[member.name] ?: GamificationProfile()
        ReadOnlyMemberProfile(member, game) { selectedMember = null }
        return
    }
    Column(modifier = Modifier.fillMaxSize()) {
        OverlayTopBar("👥 Membros", onClose)
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(house.members, key = { it.uid }) { member ->
                GlassCard(modifier = Modifier.fillMaxWidth().clickable { selectedMember = member }) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        val game = if (member.uid == profile.uid) dashboard.gamification else dashboard.memberGamification[member.name] ?: GamificationProfile()
                        AvatarCharacter(game.avatar, modifier = Modifier.size(52.dp), compact = true)
                        Column(modifier = Modifier.weight(1f).padding(horizontal = 11.dp)) {
                            Text(member.name, color = CasinhaPalette.Rose700, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(if (member.role == "admin") "Administrador" else "Membro", color = CasinhaPalette.Pink400, fontSize = 9.sp)
                        }
                        if (member.uid != profile.uid) TextButton(onClick = { onOpen(DashboardOverlay.MESSAGE) }) { Text("💌 Mensagem", color = CasinhaPalette.Rose500, fontSize = 10.sp) }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReadOnlyMemberProfile(member: HouseMember, game: GamificationProfile, onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize()) {
        OverlayTopBar("Perfil de ${member.name}", onBack)
        Column(
            modifier = Modifier.fillMaxWidth().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            AvatarCharacter(game.avatar, modifier = Modifier.size(108.dp), compact = true)
            Text(member.name, color = CasinhaPalette.Rose700, fontWeight = FontWeight.Bold, fontSize = 20.sp)
            Text(if (member.role == "admin") "Administrador" else "Membro", color = CasinhaPalette.Pink400, fontSize = 11.sp)
        }
    }
}

@Composable
private fun FriendsOverlay(code: String?, friends: List<FriendHouse>, working: Boolean, error: String?, notice: String?, onClose: () -> Unit, onLoadCode: () -> Unit, onConnect: (String) -> Unit, onRemove: (String) -> Unit) {
    var friendCode by remember { mutableStateOf("") }
    LaunchedEffect(Unit) { onLoadCode() }
    Column(modifier = Modifier.fillMaxSize()) {
        OverlayTopBar("🏘️ Vizinhos", onClose)
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Column {
                        Text("O código da tua casa", color = CasinhaPalette.Rose600, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text(code ?: if (working) "A gerar..." else "—", color = CasinhaPalette.Purple600, fontSize = 22.sp, fontWeight = FontWeight.Bold, letterSpacing = 4.sp, modifier = Modifier.padding(top = 7.dp))
                        Text("Partilha este código com uma casa amiga", color = CasinhaPalette.Pink400, fontSize = 9.sp)
                    }
                }
            }
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Column {
                        Text("Ligar outra casa", color = CasinhaPalette.Rose600, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Row(modifier = Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                            CasinhaInput(friendCode, { friendCode = it.uppercase() }, "Código", Modifier.weight(1f))
                            GradientActionButton("Ligar", { onConnect(friendCode); friendCode = "" }, enabled = friendCode.length >= 4 && !working)
                        }
                    }
                }
            }
            item { FeedbackBanner(error, notice) }
            if (friends.isEmpty()) item { EmptyState("🏘️", "Ainda não há casas vizinhas") }
            items(friends, key = { it.id }) { friend ->
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🏠", fontSize = 25.sp)
                        Column(modifier = Modifier.weight(1f).padding(horizontal = 10.dp)) { Text(friend.houseName, color = CasinhaPalette.Rose700, fontWeight = FontWeight.Bold, fontSize = 12.sp); Text(friend.members.joinToString(), color = CasinhaPalette.Pink400, fontSize = 9.sp) }
                        IconButton(onClick = { onRemove(friend.id) }) { Icon(Icons.Rounded.DeleteOutline, "Remover vizinho", tint = CasinhaPalette.Pink300) }
                    }
                }
            }
        }
    }
}

@Composable
private fun MessageOverlay(profile: UserProfile, house: House, working: Boolean, error: String?, notice: String?, onClose: () -> Unit, onSend: (String, String) -> Unit) {
    val recipients = house.members.filter { it.uid != profile.uid }
    var recipient by remember { mutableStateOf(recipients.firstOrNull()?.name.orEmpty()) }
    var message by remember { mutableStateOf("") }
    val quick = listOf("❤️ Amo-te!", "🏠 Estou a caminho de casa", "🛒 Vou ao supermercado, precisas de algo?", "🍽️ O jantar está pronto!", "☕ Queres um café?", "🧹 Já limpei a cozinha!", "💤 Vou dormir, boa noite!", "🎉 Tenho uma surpresa para ti!")
    Column(modifier = Modifier.fillMaxSize()) {
        OverlayTopBar("💌 Mensagem", onClose)
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
            item {
                Row(modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    recipients.forEach { member ->
                        Surface(modifier = Modifier.clickable { recipient = member.name }, shape = CircleShape, color = if (recipient == member.name) CasinhaPalette.Pink200 else Color.White.copy(alpha = 0.65f)) { Text("${member.avatar} ${member.name}", color = CasinhaPalette.Rose600, fontSize = 10.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(horizontal = 11.dp, vertical = 7.dp)) }
                    }
                }
            }
            item { OverlaySectionLabel("MENSAGENS RÁPIDAS") }
            items(quick) { value -> GlassCard(modifier = Modifier.fillMaxWidth().clickable(enabled = recipient.isNotBlank() && !working) { onSend(recipient, value) }) { Text(value, color = CasinhaPalette.Rose700, fontSize = 12.sp) } }
            item {
                OverlaySectionLabel("MENSAGEM PERSONALIZADA")
                Row(modifier = Modifier.padding(top = 7.dp), horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                    CasinhaInput(message, { message = it }, "Escreve uma mensagem...", Modifier.weight(1f))
                    GradientActionButton("📤", { onSend(recipient, message); message = "" }, enabled = recipient.isNotBlank() && message.isNotBlank() && !working)
                }
            }
            item { FeedbackBanner(error, notice) }
            if (recipients.isEmpty()) item { EmptyState("💌", "Não há outros membros nesta casa") }
        }
    }
}

@Composable
private fun HelpOverlay(onClose: () -> Unit) {
    val sections = listOf(
        "✨ Início" to "Resumo semanal, rotinas do dia, compras, coisinhas, projetos e gastos.",
        "🛒 Compras" to "Adiciona compras, assinala as concluídas e acompanha urgências e categorias.",
        "🪄 Coisinhas" to "Organiza pequenas tarefas, responsáveis, preços, notas e conclusão.",
        "🏡 Projetos" to "Segue o estado dos projetos, orçamento, subtarefas e conclusão.",
        "🧘 Rotinas" to "Marca as rotinas diárias e acompanha sequências.",
        "💰 Finanças" to "Despesas, rendimentos e objetivos de poupança, organizados por mês.",
        "🗓️ Calendário" to "Eventos, rotinas concluídas, projetos, feriados e previsão meteorológica.",
        "🎉 Eventos" to "Cria eventos, define data e participantes e acompanha o estado.",
        "🌤️ Tempo" to "Condições atuais e previsão para os próximos dias em Óbidos.",
    )
    Column(modifier = Modifier.fillMaxSize()) {
        OverlayTopBar("❓ Ajuda", onClose)
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
            item { GlassCard(modifier = Modifier.fillMaxWidth(), color = CasinhaPalette.Pink50) { Text("Desliza para os lados entre tabs ou usa a barra no fundo. Toca no nome da casa para abrir o menu completo.", color = CasinhaPalette.Rose600, fontSize = 12.sp, fontWeight = FontWeight.Medium) } }
            items(sections) { (title, text) -> GlassCard(modifier = Modifier.fillMaxWidth()) { Column { Text(title, color = CasinhaPalette.Rose600, fontWeight = FontWeight.Bold, fontSize = 12.sp); Text(text, color = CasinhaPalette.MutedInk, fontSize = 10.sp, modifier = Modifier.padding(top = 5.dp)) } } }
        }
    }
}

@Composable
private fun OverlayTopBar(title: String, onClose: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().background(Color.White.copy(alpha = 0.45f)).padding(horizontal = 10.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
        Spacer(Modifier.size(44.dp))
        Text(title, modifier = Modifier.weight(1f), textAlign = TextAlign.Center, color = CasinhaPalette.Rose500, fontSize = 17.sp, fontWeight = FontWeight.Bold)
        IconButton(onClick = onClose) { Icon(Icons.Rounded.Close, "Fechar", tint = CasinhaPalette.Rose400) }
    }
}

@Composable
private fun OverlaySectionLabel(text: String) {
    Text(text, color = CasinhaPalette.Rose300, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
}

@Composable
private fun OverlayTile(modifier: Modifier, emoji: String, label: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = if (selected) Color.White else Color.White.copy(alpha = 0.62f),
        border = BorderStroke(1.dp, if (selected) CasinhaPalette.Pink200 else CasinhaPalette.Pink100.copy(alpha = 0.65f)),
        shadowElevation = if (selected) 4.dp else 0.dp,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(horizontal = 5.dp, vertical = 10.dp)) {
            Text(emoji, fontSize = 20.sp)
            Text(label, color = CasinhaPalette.Rose600, fontSize = 9.sp, fontWeight = FontWeight.Medium, maxLines = 1)
        }
    }
}

@Composable
private fun OverlayGrid(items: List<Triple<String, String, DashboardOverlay>>, onOpen: (DashboardOverlay) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
        items.chunked(2).forEach { row ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                row.forEach { (emoji, label, overlay) -> OverlayTile(Modifier.weight(1f), emoji, label, false) { onOpen(overlay) } }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}
