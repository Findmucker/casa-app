package com.findmucker.casa

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private enum class DashboardDestination(val label: String, val emoji: String) {
    HOME("Início", "🏡"),
    SHOPPING("Compras", "🛒"),
    SMALL_PRIORITIES("Coisas", "🪴"),
    PROJECTS("Projetos", "🏠"),
    HABITS("Hábitos", "✨");

    fun section(): HouseSection? = when (this) {
        HOME -> null
        SHOPPING -> HouseSection.SHOPPING
        SMALL_PRIORITIES -> HouseSection.SMALL_PRIORITIES
        PROJECTS -> HouseSection.PROJECTS
        HABITS -> HouseSection.HABITS
    }
}

private data class SectionStyle(
    val start: Color,
    val end: Color,
    val accent: Color,
    val border: Color,
)

private fun styleFor(section: HouseSection): SectionStyle = when (section) {
    HouseSection.SHOPPING -> SectionStyle(
        start = Color(0xFFFFEFF5),
        end = Color(0xFFFFD6E5),
        accent = CasinhaPalette.Rose500,
        border = Color(0xFFF7A6C2),
    )
    HouseSection.SMALL_PRIORITIES -> SectionStyle(
        start = Color(0xFFF8F0FF),
        end = Color(0xFFE6D7FF),
        accent = CasinhaPalette.Purple500,
        border = Color(0xFFCBB5FA),
    )
    HouseSection.PROJECTS -> SectionStyle(
        start = Color(0xFFEDF8FF),
        end = Color(0xFFD2EEFF),
        accent = Color(0xFF258AC2),
        border = Color(0xFF9FD8F5),
    )
    HouseSection.HABITS -> SectionStyle(
        start = Color(0xFFEBFFF7),
        end = Color(0xFFCEF4E5),
        accent = CasinhaPalette.Emerald500,
        border = Color(0xFF9DE1CA),
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HouseWelcomeScreen(
    profile: UserProfile,
    house: House,
    dashboard: DashboardState,
    working: Boolean,
    error: String?,
    onAdd: (HouseSection, String) -> Unit,
    onToggle: (HouseSection, HouseItem) -> Unit,
    onDelete: (HouseSection, String) -> Unit,
    onSignOut: () -> Unit,
    onClearError: () -> Unit,
) {
    var destination by remember { mutableStateOf(DashboardDestination.HOME) }
    val section = destination.section()

    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            if (section == null) "🏡  ${house.name}" else "${section.emoji}  ${section.title}",
                            color = CasinhaPalette.Rose600,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                        )
                        Text(
                            if (section == null) "Olá, ${profile.name} ✨" else house.name,
                            fontSize = 11.sp,
                            color = CasinhaPalette.Purple500,
                            fontWeight = FontWeight.Medium,
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onSignOut) {
                        Icon(
                            Icons.AutoMirrored.Rounded.Logout,
                            contentDescription = "Terminar sessão",
                            tint = CasinhaPalette.Rose400,
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White.copy(alpha = 0.72f),
                    scrolledContainerColor = Color.White.copy(alpha = 0.92f),
                ),
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color.White.copy(alpha = 0.9f),
                tonalElevation = 0.dp,
            ) {
                DashboardDestination.entries.forEach { item ->
                    NavigationBarItem(
                        selected = destination == item,
                        onClick = { destination = item },
                        icon = { Text(item.emoji, fontSize = 21.sp) },
                        label = {
                            Text(
                                item.label,
                                fontSize = 9.sp,
                                maxLines = 1,
                                fontWeight = if (destination == item) FontWeight.Bold else FontWeight.Medium,
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = CasinhaPalette.Rose600,
                            selectedTextColor = CasinhaPalette.Rose600,
                            indicatorColor = CasinhaPalette.Pink100.copy(alpha = 0.82f),
                            unselectedTextColor = CasinhaPalette.MutedInk,
                        ),
                    )
                }
            }
        },
    ) { contentPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(contentPadding),
        ) {
            if (section == null) {
                HomeDashboard(
                    house = house,
                    dashboard = dashboard,
                    onOpen = { selected ->
                        destination = when (selected) {
                            HouseSection.SHOPPING -> DashboardDestination.SHOPPING
                            HouseSection.SMALL_PRIORITIES -> DashboardDestination.SMALL_PRIORITIES
                            HouseSection.PROJECTS -> DashboardDestination.PROJECTS
                            HouseSection.HABITS -> DashboardDestination.HABITS
                        }
                    },
                )
            } else {
                CollectionScreen(
                    section = section,
                    items = dashboard.forSection(section),
                    loading = section in dashboard.loading,
                    working = working,
                    error = error,
                    onAdd = { onAdd(section, it) },
                    onToggle = { onToggle(section, it) },
                    onDelete = { onDelete(section, it) },
                    onClearError = onClearError,
                )
            }
        }
    }
}

@Composable
private fun HomeDashboard(
    house: House,
    dashboard: DashboardState,
    onOpen: (HouseSection) -> Unit,
) {
    val allItems = dashboard.items.values.flatten()
    val done = allItems.count { it.done }
    val total = allItems.size
    val progress = if (total == 0) 0f else done.toFloat() / total

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(13.dp),
    ) {
        item {
            HeroProgressCard(done = done, total = total, progress = progress)
        }

        item {
            val habits = dashboard.forSection(HouseSection.HABITS)
            val habitsDone = habits.count { it.done }
            val habitsComplete = habits.isNotEmpty() && habitsDone == habits.size
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onOpen(HouseSection.HABITS) },
                shape = RoundedCornerShape(20.dp),
                color = if (habitsComplete) Color(0xFFD9F8EA) else Color(0xFFEDE4FF),
                border = BorderStroke(
                    1.dp,
                    if (habitsComplete) Color(0xFF98DDBE) else Color(0xFFC9B5F5),
                ),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 13.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(if (habitsComplete) "✅" else "🧘", fontSize = 25.sp)
                    Column(modifier = Modifier.weight(1f).padding(horizontal = 11.dp)) {
                        Text(
                            if (habitsComplete) "Hábitos de hoje completos!" else "Hábitos de hoje",
                            color = if (habitsComplete) CasinhaPalette.Emerald500 else CasinhaPalette.Purple500,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            "$habitsDone/${habits.size} feitos · toca para continuar",
                            color = CasinhaPalette.MutedInk,
                            fontSize = 11.sp,
                        )
                    }
                    val maxStreak = habits.maxOfOrNull { it.streak } ?: 0
                    if (maxStreak > 0) Text("🔥 $maxStreak", color = Color(0xFFE37335), fontWeight = FontWeight.Bold)
                }
            }
        }

        item {
            Text(
                "A tua casa num relance",
                color = CasinhaPalette.Rose600,
                fontSize = 16.sp,
                fontWeight = FontWeight.ExtraBold,
            )
        }

        items(HouseSection.entries.chunked(2)) { sections ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(11.dp),
            ) {
                sections.forEach { section ->
                    OverviewCard(
                        modifier = Modifier.weight(1f),
                        section = section,
                        sectionItems = dashboard.forSection(section),
                        loading = section in dashboard.loading,
                        onClick = { onOpen(section) },
                    )
                }
                if (sections.size == 1) Spacer(Modifier.weight(1f))
            }
        }

        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(22.dp),
                color = Color.White.copy(alpha = 0.72f),
                border = BorderStroke(1.dp, CasinhaPalette.Pink100),
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("💕", fontSize = 25.sp)
                    Column(modifier = Modifier.padding(start = 12.dp)) {
                        Text("A nossa equipa", color = CasinhaPalette.Rose600, fontWeight = FontWeight.Bold)
                        Text(
                            house.members.joinToString(" · ") { "${it.avatar} ${it.name}" },
                            color = CasinhaPalette.MutedInk,
                            fontSize = 12.sp,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HeroProgressCard(done: Int, total: Int, progress: Float) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(Color(0xFFE75082), Color(0xFFE85D9A), Color(0xFF9B6CE8)),
                ),
            )
            .padding(20.dp),
    ) {
        Column {
            Row(verticalAlignment = Alignment.Top) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "O que fazemos hoje?",
                        color = Color.White.copy(alpha = 0.82f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        if (done == total && total > 0) "🏆 Casa em dia!" else "✨ Um passo de cada vez",
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 20.sp,
                    )
                }
                Text(
                    "${(progress * 100).toInt()}%",
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 26.sp,
                )
            }
            Spacer(Modifier.height(14.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.26f)),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(progress.coerceIn(0f, 1f))
                        .height(10.dp)
                        .clip(CircleShape)
                        .background(Color.White),
                )
            }
            Text(
                "$done de $total concluídos",
                modifier = Modifier.padding(top = 7.dp),
                color = Color.White.copy(alpha = 0.84f),
                fontSize = 10.sp,
            )
        }
    }
}

@Composable
private fun OverviewCard(
    modifier: Modifier,
    section: HouseSection,
    sectionItems: List<HouseItem>,
    loading: Boolean,
    onClick: () -> Unit,
) {
    val style = styleFor(section)
    val pending = sectionItems.count { !it.done }
    val total = sectionItems.size
    val progress = if (total == 0) 0f else (total - pending).toFloat() / total

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(22.dp))
            .background(Brush.linearGradient(listOf(style.start, style.end)))
            .border(1.dp, style.border, RoundedCornerShape(22.dp))
            .clickable(onClick = onClick)
            .padding(15.dp),
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(section.emoji, fontSize = 27.sp)
                Spacer(Modifier.weight(1f))
                if (pending > 5) {
                    Surface(shape = CircleShape, color = style.accent.copy(alpha = 0.16f)) {
                        Text(
                            "muito!",
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
                            color = style.accent,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
            Text(
                if (loading) "…" else pending.toString(),
                modifier = Modifier.padding(top = 9.dp),
                color = CasinhaPalette.Ink,
                fontSize = 27.sp,
                fontWeight = FontWeight.ExtraBold,
            )
            Text(
                when (section) {
                    HouseSection.HABITS -> "por fazer hoje"
                    HouseSection.PROJECTS -> "projetos ativos"
                    else -> "por fazer"
                },
                color = CasinhaPalette.MutedInk,
                fontSize = 10.sp,
            )
            MiniProgress(progress = progress, color = style.accent, modifier = Modifier.padding(top = 10.dp))
            Text(
                section.title,
                modifier = Modifier.padding(top = 8.dp),
                color = style.accent,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
private fun MiniProgress(progress: Float, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(5.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.72f)),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(progress.coerceIn(0f, 1f))
                .height(5.dp)
                .clip(CircleShape)
                .background(color),
        )
    }
}

@Composable
private fun CollectionScreen(
    section: HouseSection,
    items: List<HouseItem>,
    loading: Boolean,
    working: Boolean,
    error: String?,
    onAdd: (String) -> Unit,
    onToggle: (HouseItem) -> Unit,
    onDelete: (String) -> Unit,
    onClearError: () -> Unit,
) {
    var newItem by remember(section) { mutableStateOf("") }
    val style = styleFor(section)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp),
    ) {
        CollectionSummary(section = section, items = items, style = style)

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(9.dp),
        ) {
            OutlinedTextField(
                value = newItem,
                onValueChange = { newItem = it; onClearError() },
                modifier = Modifier.weight(1f),
                label = { Text(addLabel(section)) },
                singleLine = true,
                shape = RoundedCornerShape(18.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = style.accent,
                    unfocusedBorderColor = style.border,
                    focusedContainerColor = Color.White.copy(alpha = 0.94f),
                    unfocusedContainerColor = Color.White.copy(alpha = 0.82f),
                    cursorColor = style.accent,
                    focusedLabelColor = style.accent,
                ),
            )
            val addShape = RoundedCornerShape(18.dp)
            Button(
                onClick = {
                    onAdd(newItem)
                    newItem = ""
                },
                modifier = Modifier
                    .size(58.dp)
                    .alpha(if (newItem.isNotBlank() && !working) 1f else 0.42f)
                    .background(
                        Brush.linearGradient(listOf(style.accent, CasinhaPalette.Purple500)),
                        addShape,
                    ),
                enabled = newItem.isNotBlank() && !working,
                shape = addShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Transparent,
                    disabledContainerColor = Color.Transparent,
                ),
                contentPadding = PaddingValues(0.dp),
            ) {
                Icon(Icons.Rounded.Add, contentDescription = "Adicionar", tint = Color.White)
            }
        }

        if (error != null) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 9.dp),
                color = Color(0xFFFFE3E8),
                shape = RoundedCornerShape(14.dp),
            ) {
                Text(
                    error,
                    modifier = Modifier.padding(11.dp),
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 12.sp,
                )
            }
        }

        when {
            loading -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = style.accent)
            }
            items.isEmpty() -> EmptyCollection(section)
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 14.dp),
                verticalArrangement = Arrangement.spacedBy(9.dp),
            ) {
                items(items, key = { it.id }) { item ->
                    HouseItemRow(
                        section = section,
                        style = style,
                        item = item,
                        enabled = !working,
                        onToggle = { onToggle(item) },
                        onDelete = { onDelete(item.id) },
                    )
                }
            }
        }
    }
}

@Composable
private fun CollectionSummary(section: HouseSection, items: List<HouseItem>, style: SectionStyle) {
    val done = items.count { it.done }
    val total = items.size
    val progress = if (total == 0) 0f else done.toFloat() / total
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp, bottom = 11.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(Brush.horizontalGradient(listOf(style.start, style.end)))
            .border(1.dp, style.border, RoundedCornerShape(20.dp))
            .padding(horizontal = 15.dp, vertical = 12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(section.emoji, fontSize = 28.sp)
            Column(modifier = Modifier.weight(1f).padding(horizontal = 11.dp)) {
                Text(
                    if (section == HouseSection.HABITS) "$done/$total feitos hoje" else "${total - done} por fazer",
                    color = style.accent,
                    fontWeight = FontWeight.ExtraBold,
                )
                MiniProgress(progress = progress, color = style.accent, modifier = Modifier.padding(top = 6.dp))
            }
            Text("${(progress * 100).toInt()}%", color = style.accent, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun HouseItemRow(
    section: HouseSection,
    style: SectionStyle,
    item: HouseItem,
    enabled: Boolean,
    onToggle: () -> Unit,
    onDelete: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (item.done) style.start.copy(alpha = 0.72f) else Color.White.copy(alpha = 0.9f),
        ),
        border = BorderStroke(1.dp, if (item.done) style.border.copy(alpha = 0.55f) else CasinhaPalette.Pink100),
        elevation = CardDefaults.cardElevation(defaultElevation = if (item.done) 0.dp else 2.dp),
        shape = RoundedCornerShape(19.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 7.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                modifier = Modifier
                    .size(43.dp)
                    .clickable(
                        enabled = enabled && !(section == HouseSection.HABITS && item.done),
                        onClick = onToggle,
                    ),
                shape = CircleShape,
                color = if (item.done) style.accent else style.start,
                border = BorderStroke(2.dp, style.accent),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = when {
                            item.done -> Icons.Rounded.Check
                            section == HouseSection.PROJECTS -> Icons.Rounded.Refresh
                            else -> Icons.Rounded.RadioButtonUnchecked
                        },
                        contentDescription = toggleDescription(section, item),
                        tint = if (item.done) Color.White else style.accent,
                        modifier = Modifier.size(23.dp),
                    )
                }
            }
            if (item.emoji != null) {
                Text(item.emoji, modifier = Modifier.padding(start = 9.dp), fontSize = 23.sp)
            }
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 11.dp),
            ) {
                Text(
                    item.name,
                    color = if (item.done) CasinhaPalette.Rose300 else CasinhaPalette.Ink,
                    fontWeight = FontWeight.SemiBold,
                    textDecoration = if (item.done) TextDecoration.LineThrough else null,
                )
                Row(
                    modifier = Modifier.padding(top = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Surface(shape = CircleShape, color = style.accent.copy(alpha = 0.12f)) {
                        Text(
                            itemDetail(section, item),
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                            color = style.accent,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                    if (item.urgent) Text("  🔥 urgente", color = Color(0xFFD9523C), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
            IconButton(onClick = onDelete, enabled = enabled) {
                Icon(
                    Icons.Rounded.Delete,
                    contentDescription = "Apagar ${item.name}",
                    tint = CasinhaPalette.Rose300,
                    modifier = Modifier.size(21.dp),
                )
            }
        }
    }
}

@Composable
private fun EmptyCollection(section: HouseSection) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(section.emoji, fontSize = 50.sp)
            Text("Tudo tranquilo por aqui", color = CasinhaPalette.Rose600, fontWeight = FontWeight.ExtraBold)
            Text(
                "Adiciona o primeiro item acima ✨",
                modifier = Modifier.padding(top = 4.dp),
                color = CasinhaPalette.Purple500,
                fontSize = 12.sp,
            )
        }
    }
}

private fun addLabel(section: HouseSection): String = when (section) {
    HouseSection.SHOPPING -> "Adicionar às compras…"
    HouseSection.SMALL_PRIORITIES -> "Nova coisinha…"
    HouseSection.PROJECTS -> "Novo projeto…"
    HouseSection.HABITS -> "Novo hábito…"
}

private fun toggleDescription(section: HouseSection, item: HouseItem): String = when (section) {
    HouseSection.PROJECTS -> "Avançar estado de ${item.name}"
    HouseSection.HABITS -> "Marcar ${item.name} como feito hoje"
    else -> if (item.done) "Reabrir ${item.name}" else "Concluir ${item.name}"
}

private fun itemDetail(section: HouseSection, item: HouseItem): String = when (section) {
    HouseSection.SHOPPING -> if (item.done) "Comprado" else if (item.urgent) "Urgente" else "Por comprar"
    HouseSection.SMALL_PRIORITIES -> if (item.done) "Concluído" else item.notes?.takeIf { it.isNotBlank() } ?: "Pendente"
    HouseSection.PROJECTS -> when (item.status) {
        "em progresso" -> "Em progresso"
        "concluido" -> "Concluído"
        else -> "Pendente"
    }
    HouseSection.HABITS -> if (item.done) "Feito hoje · sequência ${item.streak}" else "Sequência ${item.streak}"
}
