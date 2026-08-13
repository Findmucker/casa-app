package com.findmucker.casa

import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.List
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
        containerColor = androidx.compose.ui.graphics.Color.Transparent,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(if (section == null) house.name else section.title, fontWeight = FontWeight.Bold)
                        Text(
                            if (section == null) "Olá, ${profile.name}" else house.name,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onSignOut) {
                        Icon(Icons.AutoMirrored.Rounded.Logout, contentDescription = "Terminar sessão")
                    }
                },
            )
        },
        bottomBar = {
            NavigationBar {
                DashboardDestination.entries.forEach { item ->
                    NavigationBarItem(
                        selected = destination == item,
                        onClick = { destination = item },
                        icon = { Text(item.emoji, fontSize = 20.sp) },
                        label = { Text(item.label, fontSize = 9.sp, maxLines = 1) },
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
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text(
                "A tua casa num relance",
                modifier = Modifier.padding(top = 18.dp, bottom = 4.dp),
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
            )
        }
        items(HouseSection.entries) { section ->
            val sectionItems = dashboard.forSection(section)
            val pending = sectionItems.count { !it.done }
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onOpen(section) },
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f)),
                shape = RoundedCornerShape(20.dp),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(section.emoji, fontSize = 30.sp)
                    Column(modifier = Modifier.weight(1f).padding(horizontal = 14.dp)) {
                        Text(section.title, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        Text(
                            if (section in dashboard.loading) "A sincronizar…" else "$pending por fazer · ${sectionItems.size} no total",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 13.sp,
                        )
                    }
                    Icon(Icons.AutoMirrored.Rounded.List, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                }
            }
        }
        item {
            Text(
                "${house.members.size} ${if (house.members.size == 1) "pessoa" else "pessoas"} nesta casa",
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 14.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 18.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 14.dp, bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            OutlinedTextField(
                value = newItem,
                onValueChange = { newItem = it; onClearError() },
                modifier = Modifier.weight(1f),
                label = { Text(addLabel(section)) },
                singleLine = true,
            )
            Button(
                onClick = {
                    onAdd(newItem)
                    newItem = ""
                },
                enabled = newItem.isNotBlank() && !working,
                contentPadding = androidx.compose.foundation.layout.PaddingValues(14.dp),
            ) {
                Icon(Icons.Rounded.Add, contentDescription = "Adicionar")
            }
        }

        if (error != null) {
            Text(
                error,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                color = MaterialTheme.colorScheme.error,
            )
        }

        when {
            loading -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            items.isEmpty() -> EmptyCollection(section)
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(items, key = { it.id }) { item ->
                    HouseItemRow(
                        section = section,
                        item = item,
                        enabled = !working,
                        onToggle = { onToggle(item) },
                        onDelete = { onDelete(item.id) },
                    )
                }
                item { Spacer(Modifier.height(12.dp)) }
            }
        }
    }
}

@Composable
private fun HouseItemRow(
    section: HouseSection,
    item: HouseItem,
    enabled: Boolean,
    onToggle: () -> Unit,
    onDelete: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f)),
        shape = RoundedCornerShape(16.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onToggle, enabled = enabled && !(section == HouseSection.HABITS && item.done)) {
                Icon(
                    imageVector = if (item.done) Icons.Rounded.CheckCircle else if (section == HouseSection.PROJECTS) Icons.Rounded.Refresh else Icons.Rounded.RadioButtonUnchecked,
                    contentDescription = toggleDescription(section, item),
                    tint = if (item.done) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (item.emoji != null) Text(item.emoji, fontSize = 22.sp)
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 8.dp),
            ) {
                Text(
                    item.name,
                    fontWeight = FontWeight.SemiBold,
                    textDecoration = if (item.done) TextDecoration.LineThrough else null,
                )
                val detail = itemDetail(section, item)
                if (detail.isNotEmpty()) {
                    Text(detail, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (item.urgent) Text("🔥", fontSize = 18.sp)
            IconButton(onClick = onDelete, enabled = enabled) {
                Icon(Icons.Rounded.Delete, contentDescription = "Apagar ${item.name}")
            }
        }
    }
}

@Composable
private fun EmptyCollection(section: HouseSection) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(section.emoji, fontSize = 42.sp)
            Text("Ainda não há nada aqui", fontWeight = FontWeight.Bold)
            Text(
                "Adiciona o primeiro item acima.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private fun addLabel(section: HouseSection): String = when (section) {
    HouseSection.SHOPPING -> "Adicionar às compras"
    HouseSection.SMALL_PRIORITIES -> "Nova coisinha"
    HouseSection.PROJECTS -> "Novo projeto"
    HouseSection.HABITS -> "Novo hábito"
}

private fun toggleDescription(section: HouseSection, item: HouseItem): String = when (section) {
    HouseSection.PROJECTS -> "Avançar estado de ${item.name}"
    HouseSection.HABITS -> "Marcar ${item.name} como feito hoje"
    else -> if (item.done) "Reabrir ${item.name}" else "Concluir ${item.name}"
}

private fun itemDetail(section: HouseSection, item: HouseItem): String = when (section) {
    HouseSection.SHOPPING -> if (item.done) "Comprado" else if (item.urgent) "Urgente" else "Por comprar"
    HouseSection.SMALL_PRIORITIES -> if (item.done) "Concluído" else item.notes.orEmpty()
    HouseSection.PROJECTS -> when (item.status) {
        "em progresso" -> "Em progresso"
        "concluido" -> "Concluído"
        else -> "Pendente"
    }
    HouseSection.HABITS -> if (item.done) "Feito hoje · sequência ${item.streak}" else "Sequência ${item.streak}"
}
