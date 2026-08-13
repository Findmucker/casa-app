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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material.icons.rounded.KeyboardArrowUp
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private data class DomainVisual(
    val accent: Color,
    val soft: Color,
    val border: Color,
    val empty: String,
    val placeholder: String,
)

private fun domainVisual(section: HouseSection): DomainVisual = when (section) {
    HouseSection.SHOPPING -> DomainVisual(CasinhaPalette.Rose400, CasinhaPalette.Pink50, CasinhaPalette.Pink200, "Nada para comprar!", "O que falta comprar?")
    HouseSection.SMALL_PRIORITIES -> DomainVisual(CasinhaPalette.Pink500, CasinhaPalette.Pink50, CasinhaPalette.Pink200, "Nenhuma coisinha por agora!", "Coisinha nova...")
    HouseSection.PROJECTS -> DomainVisual(CasinhaPalette.Blue400, Color(0xFFEFF6FF), CasinhaPalette.Blue100, "Nenhum projeto ainda!", "Novo projeto...")
    HouseSection.HABITS -> DomainVisual(CasinhaPalette.Purple500, CasinhaPalette.Purple50, CasinhaPalette.Purple200, "Nenhuma rotina ainda!", "Nova rotina...")
}

@Composable
fun DomainCollectionScreen(
    section: HouseSection,
    items: List<HouseItem>,
    loading: Boolean,
    working: Boolean,
    error: String?,
    notice: String?,
    onAdd: (String) -> Unit,
    onAddDetailed: (ItemDraft) -> Unit,
    onToggle: (HouseItem) -> Unit,
    onDelete: (String) -> Unit,
    onUpdate: (String, Map<String, Any?>) -> Unit,
    onMove: (HouseItem, HouseItem) -> Unit,
    onAddSubtask: (HouseItem, String) -> Unit,
    onToggleSubtask: (HouseItem, Subtask) -> Unit,
    onDeleteSubtask: (HouseItem, String) -> Unit,
    members: List<HouseMember>,
    onClearFeedback: () -> Unit,
) {
    val visual = domainVisual(section)
    var newItem by remember(section) { mutableStateOf("") }
    var showAdd by remember(section) { mutableStateOf(section == HouseSection.SHOPPING || section == HouseSection.SMALL_PRIORITIES) }
    var urgent by remember(section) { mutableStateOf(false) }
    var category by remember(section) { mutableStateOf("") }
    var assignee by remember(section) { mutableStateOf("ambos") }
    var price by remember(section) { mutableStateOf("") }
    var notes by remember(section) { mutableStateOf("") }
    var budget by remember(section) { mutableStateOf("") }
    var spent by remember(section) { mutableStateOf("") }
    var emoji by remember(section) { mutableStateOf("✨") }
    var reminderTime by remember(section) { mutableStateOf("") }
    var selectedDays by remember(section) { mutableStateOf(emptySet<Int>()) }
    val doneCount = items.count { it.done }
    val pending = items.filterNot { it.done }
    val completed = items.filter { it.done }

    Column(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White.copy(alpha = 0.62f))
                .padding(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (section == HouseSection.HABITS && items.isNotEmpty() && doneCount == items.size) "✨ Rotinas completas!" else "${section.emoji} ${section.title}",
                        color = visual.accent,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    if (items.isNotEmpty()) {
                        Row(modifier = Modifier.padding(top = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("$doneCount/${items.size}", color = visual.accent, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            CasinhaProgress(
                                progress = doneCount.toFloat() / items.size,
                                color = visual.accent,
                                modifier = Modifier.weight(1f).padding(start = 9.dp),
                                trackColor = visual.soft,
                            )
                            if (doneCount == items.size) Text("🎉", modifier = Modifier.padding(start = 7.dp), fontSize = 13.sp)
                        }
                    }
                }
                if (section == HouseSection.PROJECTS || section == HouseSection.HABITS) {
                    Surface(
                        modifier = Modifier.size(36.dp).clickable { showAdd = !showAdd },
                        shape = CircleShape,
                        color = Color.Transparent,
                    ) {
                        Box(
                            modifier = Modifier.background(Brush.horizontalGradient(listOf(visual.accent, CasinhaPalette.Pink400))),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Rounded.Add, contentDescription = "Adicionar", tint = Color.White)
                        }
                    }
                }
            }

            if (showAdd) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    CasinhaInput(
                        value = newItem,
                        onValueChange = { newItem = it; onClearFeedback() },
                        placeholder = visual.placeholder,
                        modifier = Modifier.weight(1f),
                    )
                    Surface(
                        modifier = Modifier.size(52.dp).alpha(if (newItem.isBlank() || working) 0.35f else 1f).clickable(
                            enabled = newItem.isNotBlank() && !working,
                        ) {
                            val draft = ItemDraft(
                                name = newItem,
                                urgent = urgent,
                                category = category.ifBlank { null },
                                assignee = assignee,
                                price = price.replace(',', '.').toDoubleOrNull(),
                                notes = notes.ifBlank { null },
                                budget = budget.replace(',', '.').toDoubleOrNull(),
                                spent = spent.replace(',', '.').toDoubleOrNull(),
                                emoji = emoji,
                                reminderTime = reminderTime.ifBlank { null },
                                days = selectedDays.sorted(),
                            )
                            if (draft == ItemDraft(name = newItem)) onAdd(newItem) else onAddDetailed(draft)
                            newItem = ""
                            urgent = false
                            category = ""
                            price = ""
                            notes = ""
                            budget = ""
                            spent = ""
                            reminderTime = ""
                            if (section == HouseSection.PROJECTS || section == HouseSection.HABITS) showAdd = false
                        },
                        shape = RoundedCornerShape(16.dp),
                        color = Color.Transparent,
                    ) {
                        Box(
                            modifier = Modifier.background(Brush.horizontalGradient(listOf(visual.accent, CasinhaPalette.Rose400))),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Rounded.Add, contentDescription = "Adicionar", tint = Color.White)
                        }
                    }
                }
                DomainAddOptions(
                    section = section,
                    urgent = urgent,
                    onUrgent = { urgent = it },
                    category = category,
                    onCategory = { category = it },
                    assignee = assignee,
                    onAssignee = { assignee = it },
                    price = price,
                    onPrice = { price = it },
                    notes = notes,
                    onNotes = { notes = it },
                    budget = budget,
                    onBudget = { budget = it },
                    spent = spent,
                    onSpent = { spent = it },
                    emoji = emoji,
                    onEmoji = { emoji = it },
                    reminderTime = reminderTime,
                    onReminderTime = { reminderTime = it },
                    selectedDays = selectedDays,
                    onSelectedDays = { selectedDays = it },
                    members = members,
                )
            }
            FeedbackBanner(error, notice, Modifier.padding(top = 8.dp))
        }

        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(section.emoji, fontSize = 32.sp)
                    CircularProgressIndicator(color = visual.accent, modifier = Modifier.padding(top = 10.dp))
                }
            }
            return@Column
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(9.dp),
        ) {
            if (items.isEmpty()) item { EmptyState(section.emoji, visual.empty) }

            if (section == HouseSection.SHOPPING) {
                val urgent = pending.filter { it.urgent }
                if (urgent.isNotEmpty()) {
                    item { GroupLabel("🔥 Urgente", urgent.size, CasinhaPalette.Red500) }
                    items(urgent, key = { "urgent-${it.id}" }) { item -> DomainItemRow(section, item, visual, working, onToggle, onDelete, onUpdate, null, null, onAddSubtask, onToggleSubtask, onDeleteSubtask) }
                }
                val normal = pending.filterNot { it.urgent }
                val grouped = normal.groupBy { it.category ?: "🌸 Outros" }
                grouped.forEach { (category, values) ->
                    item { GroupLabel(category, values.size, visual.accent) }
                    items(values, key = { it.id }) { item -> DomainItemRow(section, item, visual, working, onToggle, onDelete, onUpdate, null, null, onAddSubtask, onToggleSubtask, onDeleteSubtask) }
                }
            } else if (section == HouseSection.SMALL_PRIORITIES) {
                val grouped = pending.groupBy { it.category ?: "🌸 Outros" }
                grouped.forEach { (category, values) ->
                    item { GroupLabel(category, values.size, visual.accent) }
                    items(values, key = { it.id }) { item ->
                        val position = items.indexOf(item)
                        DomainItemRow(section, item, visual, working, onToggle, onDelete, onUpdate, items.getOrNull(position - 1), items.getOrNull(position + 1), onAddSubtask, onToggleSubtask, onDeleteSubtask, onMove)
                    }
                }
            } else {
                items(pending, key = { it.id }) { item ->
                    val position = items.indexOf(item)
                    DomainItemRow(section, item, visual, working, onToggle, onDelete, onUpdate, items.getOrNull(position - 1), items.getOrNull(position + 1), onAddSubtask, onToggleSubtask, onDeleteSubtask, onMove)
                }
            }

            if (completed.isNotEmpty()) {
                item { GroupLabel("✓ ${if (section == HouseSection.SHOPPING) "Compradinho" else "Concluído"}", completed.size, visual.accent.copy(alpha = 0.75f)) }
                items(completed, key = { "done-${it.id}" }) { item -> DomainItemRow(section, item, visual, working, onToggle, onDelete, onUpdate, null, null, onAddSubtask, onToggleSubtask, onDeleteSubtask) }
            }
        }
    }
}

@Composable
private fun DomainAddOptions(
    section: HouseSection,
    urgent: Boolean,
    onUrgent: (Boolean) -> Unit,
    category: String,
    onCategory: (String) -> Unit,
    assignee: String,
    onAssignee: (String) -> Unit,
    price: String,
    onPrice: (String) -> Unit,
    notes: String,
    onNotes: (String) -> Unit,
    budget: String,
    onBudget: (String) -> Unit,
    spent: String,
    onSpent: (String) -> Unit,
    emoji: String,
    onEmoji: (String) -> Unit,
    reminderTime: String,
    onReminderTime: (String) -> Unit,
    selectedDays: Set<Int>,
    onSelectedDays: (Set<Int>) -> Unit,
    members: List<HouseMember>,
) {
    Column(modifier = Modifier.padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
        when (section) {
            HouseSection.SHOPPING -> {
                Surface(modifier = Modifier.clickable { onUrgent(!urgent) }, shape = CircleShape, color = if (urgent) CasinhaPalette.Rose100 else CasinhaPalette.Pink50) {
                    Text(if (urgent) "🔥 Urgente — comprar hoje!" else "🕊️ Normal — pode esperar", color = if (urgent) CasinhaPalette.Red500 else CasinhaPalette.Pink400, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp))
                }
            }
            HouseSection.SMALL_PRIORITIES -> {
                Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    CasinhaInput(price, onPrice, "Preço €", Modifier.width(100.dp), KeyboardType.Decimal)
                    CasinhaInput(notes, onNotes, "Notas...", Modifier.weight(1f))
                }
                AssigneeChips(assignee, onAssignee, members)
            }
            HouseSection.PROJECTS -> {
                Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    CasinhaInput(budget, onBudget, "Orçamento €", Modifier.weight(1f), KeyboardType.Decimal)
                    CasinhaInput(spent, onSpent, "Gasto €", Modifier.weight(1f), KeyboardType.Decimal)
                }
                CasinhaInput(notes, onNotes, "Notas do projeto...", Modifier.fillMaxWidth())
                CategoryChips(listOf("🏠 Casa", "🛠️ Obras", "🌿 Exterior", "💡 Ideias"), category, onCategory)
            }
            HouseSection.HABITS -> {
                CategoryChips(listOf("✨", "💊", "🏃", "💧", "🧘", "📚", "🪥", "🐾"), emoji, onEmoji)
                CasinhaInput(reminderTime, onReminderTime, "Hora (HH:MM)", Modifier.fillMaxWidth())
                AssigneeChips(assignee, onAssignee, members)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    listOf("D", "S", "T", "Q", "Q", "S", "S").forEachIndexed { index, label ->
                        Surface(
                            modifier = Modifier.weight(1f).clickable {
                                onSelectedDays(if (index in selectedDays) selectedDays - index else selectedDays + index)
                            },
                            shape = RoundedCornerShape(8.dp),
                            color = if (selectedDays.isEmpty() || index in selectedDays) CasinhaPalette.Purple200 else CasinhaPalette.Purple50,
                        ) {
                            Text(label, color = if (selectedDays.isEmpty() || index in selectedDays) CasinhaPalette.Purple600 else CasinhaPalette.Purple300, textAlign = androidx.compose.ui.text.style.TextAlign.Center, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 7.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AssigneeChips(selected: String, onSelected: (String) -> Unit, members: List<HouseMember>) {
    Row(modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        (listOf("ambos") + members.map { it.name }).forEach { value ->
            Surface(modifier = Modifier.clickable { onSelected(value) }, shape = CircleShape, color = if (selected == value) CasinhaPalette.Pink200 else CasinhaPalette.Pink50) {
                Text(if (value == "ambos") "👫 Ambos" else "👤 $value", color = if (selected == value) CasinhaPalette.Rose600 else CasinhaPalette.Pink400, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp))
            }
        }
    }
}

@Composable
private fun CategoryChips(values: List<String>, selected: String, onSelected: (String) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        values.forEach { value ->
            Surface(modifier = Modifier.clickable { onSelected(value) }, shape = CircleShape, color = if (selected == value) CasinhaPalette.Pink200 else CasinhaPalette.Pink50) {
                Text(value, color = if (selected == value) CasinhaPalette.Rose600 else CasinhaPalette.Pink400, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp))
            }
        }
    }
}

@Composable
private fun GroupLabel(label: String, count: Int, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 7.dp, bottom = 2.dp)) {
        Text(label, color = color, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
        Surface(modifier = Modifier.padding(start = 7.dp), shape = CircleShape, color = color.copy(alpha = 0.12f)) {
            Text(count.toString(), color = color, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp))
        }
    }
}

@Composable
private fun DomainItemRow(
    section: HouseSection,
    item: HouseItem,
    visual: DomainVisual,
    working: Boolean,
    onToggle: (HouseItem) -> Unit,
    onDelete: (String) -> Unit,
    onUpdate: (String, Map<String, Any?>) -> Unit,
    previous: HouseItem?,
    next: HouseItem?,
    onAddSubtask: (HouseItem, String) -> Unit,
    onToggleSubtask: (HouseItem, Subtask) -> Unit,
    onDeleteSubtask: (HouseItem, String) -> Unit,
    onMove: (HouseItem, HouseItem) -> Unit = { _, _ -> },
) {
    var editing by remember(item.id) { mutableStateOf(false) }
    var notes by remember(item.id, item.notes) { mutableStateOf(item.notes.orEmpty()) }
    var price by remember(item.id, item.price) { mutableStateOf(item.price?.toString().orEmpty()) }
    var budget by remember(item.id, item.budget) { mutableStateOf(item.budget?.toString().orEmpty()) }
    var spent by remember(item.id, item.spent) { mutableStateOf(item.spent?.toString().orEmpty()) }
    var subtaskName by remember(item.id) { mutableStateOf("") }
    GlassCard(
        modifier = Modifier.fillMaxWidth().alpha(if (item.done) 0.58f else 1f),
        borderColor = if (item.urgent && !item.done) CasinhaPalette.Rose200 else visual.border.copy(alpha = 0.45f),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp),
    ) {
        Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(
                modifier = Modifier.size(36.dp).clickable(enabled = !working) { onToggle(item) },
                shape = CircleShape,
                color = if (item.done) visual.accent else visual.soft,
                border = BorderStroke(1.dp, visual.accent.copy(alpha = 0.42f)),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    if (item.done) Icon(Icons.Rounded.Check, contentDescription = "Desmarcar", tint = Color.White, modifier = Modifier.size(18.dp))
                    else Text(item.emoji ?: if (section == HouseSection.HABITS) "✨" else "", fontSize = 17.sp)
                }
            }
            Column(modifier = Modifier.weight(1f).padding(horizontal = 10.dp)) {
                Text(
                    item.name,
                    color = if (item.done) CasinhaPalette.MutedInk else CasinhaPalette.Rose700,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    textDecoration = if (item.done) TextDecoration.LineThrough else TextDecoration.None,
                )
                val details = buildList {
                    item.assignee?.takeIf { it.isNotBlank() }?.let { add(if (it == "ambos") "👫 Ambos" else "👤 $it") }
                    item.price?.takeIf { it > 0 }?.let { add(it.asEuro()) }
                    item.reminderTime?.takeIf { it.isNotBlank() }?.let { add("🔔 $it") }
                    if (section == HouseSection.HABITS && item.streak > 0) add("🔥 ${item.streak} dias")
                    item.addedBy?.takeIf { it.isNotBlank() }?.let { add("por $it") }
                }
                if (details.isNotEmpty()) Text(details.joinToString(" · "), color = CasinhaPalette.Pink400, fontSize = 9.sp, modifier = Modifier.padding(top = 2.dp))
                if (!item.notes.isNullOrBlank()) Text(item.notes, color = CasinhaPalette.MutedInk, fontSize = 10.sp, modifier = Modifier.padding(top = 3.dp))
                if (section == HouseSection.PROJECTS) ProjectMeta(item)
            }
            if (section == HouseSection.PROJECTS && !item.done) {
                Surface(shape = CircleShape, color = projectStatusColor(item.status).copy(alpha = 0.12f)) {
                    Text(projectStatusLabel(item.status), color = projectStatusColor(item.status), fontSize = 8.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 7.dp, vertical = 4.dp))
                }
            }
            if (!item.done) IconButton(onClick = { editing = !editing }, modifier = Modifier.size(34.dp)) {
                Icon(Icons.Rounded.Edit, contentDescription = "Editar ${item.name}", tint = visual.accent.copy(alpha = 0.72f), modifier = Modifier.size(17.dp))
            }
            IconButton(onClick = { onDelete(item.id) }, enabled = !working, modifier = Modifier.size(34.dp)) {
                Icon(Icons.Rounded.DeleteOutline, contentDescription = "Apagar ${item.name}", tint = CasinhaPalette.Pink300, modifier = Modifier.size(18.dp))
            }
        }
        if (editing) {
            Column(modifier = Modifier.padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                CasinhaInput(notes, { notes = it }, "Notas...", Modifier.fillMaxWidth())
                if (section == HouseSection.SMALL_PRIORITIES) CasinhaInput(price, { price = it }, "Preço €", Modifier.fillMaxWidth(), KeyboardType.Decimal)
                if (section == HouseSection.PROJECTS) {
                    Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        CasinhaInput(budget, { budget = it }, "Orçamento €", Modifier.weight(1f), KeyboardType.Decimal)
                        CasinhaInput(spent, { spent = it }, "Gasto €", Modifier.weight(1f), KeyboardType.Decimal)
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    GradientActionButton("Guardar", {
                        onUpdate(item.id, buildMap {
                            put("notes", notes.ifBlank { null })
                            if (section == HouseSection.SMALL_PRIORITIES) put("price", price.replace(',', '.').toDoubleOrNull())
                            if (section == HouseSection.PROJECTS) {
                                put("budget", budget.replace(',', '.').toDoubleOrNull() ?: 0.0)
                                put("spent", spent.replace(',', '.').toDoubleOrNull() ?: 0.0)
                            }
                        })
                        editing = false
                    }, enabled = !working)
                    if (previous != null) IconButton(onClick = { onMove(item, previous) }) { Icon(Icons.Rounded.KeyboardArrowUp, "Mover para cima", tint = visual.accent) }
                    if (next != null) IconButton(onClick = { onMove(item, next) }) { Icon(Icons.Rounded.KeyboardArrowDown, "Mover para baixo", tint = visual.accent) }
                }
            }
        }
        if (section == HouseSection.PROJECTS && (editing || item.subtasks.isNotEmpty())) {
            Column(modifier = Modifier.padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                item.subtasks.forEach { subtask ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(modifier = Modifier.size(25.dp).clickable { onToggleSubtask(item, subtask) }, shape = CircleShape, color = if (subtask.done) CasinhaPalette.Emerald400 else CasinhaPalette.Blue100) {
                            Box(contentAlignment = Alignment.Center) { if (subtask.done) Icon(Icons.Rounded.Check, "Desmarcar subtarefa", tint = Color.White, modifier = Modifier.size(14.dp)) }
                        }
                        Text(subtask.name, color = CasinhaPalette.MutedInk, fontSize = 10.sp, modifier = Modifier.weight(1f).padding(horizontal = 8.dp), textDecoration = if (subtask.done) TextDecoration.LineThrough else TextDecoration.None)
                        IconButton(onClick = { onDeleteSubtask(item, subtask.id) }, modifier = Modifier.size(28.dp)) { Icon(Icons.Rounded.DeleteOutline, "Apagar subtarefa", tint = CasinhaPalette.Pink300, modifier = Modifier.size(15.dp)) }
                    }
                }
                if (editing) Row(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                    CasinhaInput(subtaskName, { subtaskName = it }, "Nova subtarefa...", Modifier.weight(1f))
                    TextButton(onClick = { if (subtaskName.isNotBlank()) { onAddSubtask(item, subtaskName); subtaskName = "" } }) { Text("+", color = CasinhaPalette.Blue400, fontSize = 20.sp) }
                }
            }
        }
        }
    }
}

@Composable
private fun ProjectMeta(item: HouseItem) {
    val budget = item.budget ?: 0.0
    val spent = item.spent ?: 0.0
    val doneSubtasks = item.subtasks.count { it.done }
    if (budget > 0 || item.subtasks.isNotEmpty()) {
        Row(modifier = Modifier.padding(top = 4.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (budget > 0) Text("💶 ${spent.asEuro()} / ${budget.asEuro()}", color = CasinhaPalette.Blue400, fontSize = 9.sp)
            if (item.subtasks.isNotEmpty()) Text("✓ $doneSubtasks/${item.subtasks.size}", color = CasinhaPalette.Emerald500, fontSize = 9.sp)
        }
    }
}

private fun projectStatusLabel(status: String?): String = when (status) {
    "em progresso" -> "EM PROGRESSO"
    "concluido" -> "CONCLUÍDO"
    else -> "PENDENTE"
}

private fun projectStatusColor(status: String?): Color = when (status) {
    "em progresso" -> CasinhaPalette.Blue400
    "concluido" -> CasinhaPalette.Emerald500
    else -> CasinhaPalette.Amber500
}
