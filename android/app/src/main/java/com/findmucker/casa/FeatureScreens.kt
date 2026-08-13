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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.ArrowForward
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

private enum class FinanceTab(val label: String, val emoji: String) {
    EXPENSES("Despesas", "💸"), INCOME("Rendimentos", "💵"), SAVINGS("Poupanças", "🪙"),
}

@Composable
fun FinanceScreen(
    dashboard: DashboardState,
    house: House,
    working: Boolean,
    error: String?,
    notice: String?,
    onAddExpense: (String, String, String, String) -> Unit,
    onAddIncome: (String, String, String, Boolean) -> Unit,
    onAddSavings: (String, String, String) -> Unit,
    onDeposit: (SavingsGoal, String) -> Unit,
    onDelete: (String, String) -> Unit,
) {
    var tab by remember { mutableStateOf(FinanceTab.EXPENSES) }
    var month by remember { mutableStateOf(YearMonth.now()) }
    var showAdd by remember { mutableStateOf(false) }
    val monthKey = month.toString()
    val expenses = dashboard.expenses.filter { it.date.startsWith(monthKey) }
    val incomes = dashboard.incomes.filter { it.date.startsWith(monthKey) }
    val totalExpenses = expenses.sumOf { it.amount }
    val totalIncome = incomes.sumOf { it.amount }
    val balance = totalIncome - totalExpenses
    val monthLabel = month.month.getDisplayName(TextStyle.FULL, Locale("pt", "PT")).replaceFirstChar { it.titlecase(Locale("pt", "PT")) }

    Column(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxWidth().background(Color.White.copy(alpha = 0.62f)).padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("💰 Finanças", color = CasinhaPalette.Emerald600, fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.weight(1f))
                Surface(
                    modifier = Modifier.size(36.dp).clickable { showAdd = !showAdd },
                    shape = CircleShape,
                    color = Color.Transparent,
                ) {
                    Box(modifier = Modifier.background(Brush.horizontalGradient(listOf(CasinhaPalette.Emerald400, Color(0xFF2DD4BF)))), contentAlignment = Alignment.Center) {
                        Icon(Icons.Rounded.Add, contentDescription = "Adicionar", tint = Color.White)
                    }
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                IconButton(onClick = { month = month.minusMonths(1) }) { Icon(Icons.Rounded.ArrowBack, "Mês anterior", tint = CasinhaPalette.Emerald400) }
                Text("$monthLabel ${month.year}", color = CasinhaPalette.Emerald700, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                IconButton(onClick = { month = month.plusMonths(1) }) { Icon(Icons.Rounded.ArrowForward, "Mês seguinte", tint = CasinhaPalette.Emerald400) }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) {
                FinanceTotal("Rendimentos", totalIncome, CasinhaPalette.Emerald600)
                FinanceTotal("Despesas", totalExpenses, CasinhaPalette.Red500)
                FinanceTotal("Saldo", balance, if (balance >= 0) CasinhaPalette.Emerald600 else CasinhaPalette.Red500)
            }
            Row(modifier = Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                FinanceTab.entries.forEach { item ->
                    Surface(
                        modifier = Modifier.weight(1f).clickable { tab = item; showAdd = false },
                        shape = RoundedCornerShape(12.dp),
                        color = if (item == tab) CasinhaPalette.Emerald200 else CasinhaPalette.Emerald50,
                    ) {
                        Text("${item.emoji} ${item.label}", color = if (item == tab) CasinhaPalette.Emerald700 else CasinhaPalette.Emerald500, fontWeight = FontWeight.SemiBold, fontSize = 10.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(vertical = 9.dp))
                    }
                }
            }
            if (showAdd) FinanceAddForm(tab, house, working, onAddExpense, onAddIncome, onAddSavings) { showAdd = false }
            FeedbackBanner(error, notice, Modifier.padding(top = 8.dp))
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(9.dp),
        ) {
            when (tab) {
                FinanceTab.EXPENSES -> {
                    if (expenses.isEmpty()) item { EmptyState("💸", "Sem despesas neste mês") }
                    items(expenses, key = { it.id }) { expense ->
                        FinanceRow(
                            emoji = expenseCategoryEmoji(expense.category), title = expense.name,
                            detail = "${expense.category.replaceFirstChar { it.uppercase() }} · ${expense.paidBy}",
                            amount = -expense.amount, onDelete = { onDelete("expenses", expense.id) },
                        )
                    }
                }
                FinanceTab.INCOME -> {
                    if (incomes.isEmpty()) item { EmptyState("💵", "Sem rendimentos neste mês") }
                    items(incomes, key = { it.id }) { income ->
                        FinanceRow(
                            emoji = "💵", title = income.name,
                            detail = "${income.owner}${if (income.recurring) " · recorrente" else ""}",
                            amount = income.amount, onDelete = { onDelete("income", income.id) },
                        )
                    }
                }
                FinanceTab.SAVINGS -> {
                    if (dashboard.savingsGoals.isEmpty()) item { EmptyState("🎯", "Ainda não há objetivos de poupança") }
                    items(dashboard.savingsGoals, key = { it.id }) { goal ->
                        SavingsCard(goal, working, onDeposit) { onDelete("savings_goals", goal.id) }
                    }
                }
            }
        }
    }
}

@Composable
private fun FinanceTotal(label: String, value: Double, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(vertical = 7.dp)) {
        Text(label, color = CasinhaPalette.Emerald400, fontSize = 10.sp)
        Text(value.asEuro(), color = color, fontWeight = FontWeight.Bold, fontSize = 13.sp)
    }
}

@Composable
private fun FinanceAddForm(
    tab: FinanceTab,
    house: House,
    working: Boolean,
    onAddExpense: (String, String, String, String) -> Unit,
    onAddIncome: (String, String, String, Boolean) -> Unit,
    onAddSavings: (String, String, String) -> Unit,
    onDone: () -> Unit,
) {
    var name by remember(tab) { mutableStateOf("") }
    var amount by remember(tab) { mutableStateOf("") }
    var category by remember { mutableStateOf("compras") }
    var owner by remember { mutableStateOf("ambos") }
    var recurring by remember { mutableStateOf(false) }
    var emoji by remember { mutableStateOf("🎯") }
    val people = listOf("ambos") + house.members.map { it.name }

    Column(modifier = Modifier.padding(top = 10.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
            CasinhaInput(name, { name = it }, when (tab) {
                FinanceTab.EXPENSES -> "Descrição da despesa"
                FinanceTab.INCOME -> "Descrição do rendimento"
                FinanceTab.SAVINGS -> "Nome do objetivo"
            }, Modifier.weight(1f))
            CasinhaInput(amount, { amount = it }, "€", Modifier.width(92.dp), KeyboardType.Decimal)
        }
        if (tab == FinanceTab.EXPENSES) {
            Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                listOf("casa", "compras", "restaurantes", "transporte", "lazer", "saude", "outros").forEach { value ->
                    ChoiceChip("${expenseCategoryEmoji(value)} ${value.replaceFirstChar { it.uppercase() }}", value == category) { category = value }
                }
            }
        }
        if (tab != FinanceTab.SAVINGS) {
            Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                people.forEach { value -> ChoiceChip(if (value == "ambos") "👫 Ambos" else "👤 $value", value == owner) { owner = value } }
            }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                listOf("🎯", "✈️", "🚗", "🏡", "💍", "🎓", "💻", "🎮").forEach { value -> ChoiceChip(value, value == emoji) { emoji = value } }
            }
        }
        if (tab == FinanceTab.INCOME) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { recurring = !recurring }) {
                Checkbox(checked = recurring, onCheckedChange = { recurring = it }, colors = CheckboxDefaults.colors(checkedColor = CasinhaPalette.Emerald500))
                Text("Rendimento recorrente", color = CasinhaPalette.Emerald600, fontSize = 11.sp)
            }
        }
        GradientActionButton(
            text = "Adicionar",
            onClick = {
                when (tab) {
                    FinanceTab.EXPENSES -> onAddExpense(name, amount, category, owner)
                    FinanceTab.INCOME -> onAddIncome(name, amount, owner, recurring)
                    FinanceTab.SAVINGS -> onAddSavings(name, emoji, amount)
                }
                if (name.isNotBlank() && amount.isNotBlank()) onDone()
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = name.isNotBlank() && amount.isNotBlank() && !working,
            start = CasinhaPalette.Emerald400,
            end = Color(0xFF2DD4BF),
        )
    }
}

@Composable
private fun ChoiceChip(text: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.clickable(onClick = onClick),
        shape = CircleShape,
        color = if (selected) CasinhaPalette.Emerald200 else CasinhaPalette.Emerald50,
    ) {
        Text(text, color = if (selected) CasinhaPalette.Emerald700 else CasinhaPalette.Emerald500, fontSize = 10.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp))
    }
}

@Composable
private fun FinanceRow(emoji: String, title: String, detail: String, amount: Double, onDelete: () -> Unit) {
    GlassCard(modifier = Modifier.fillMaxWidth(), borderColor = CasinhaPalette.Emerald100) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(emoji, fontSize = 22.sp)
            Column(modifier = Modifier.weight(1f).padding(horizontal = 10.dp)) {
                Text(title, color = CasinhaPalette.Emerald700, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                Text(detail, color = CasinhaPalette.Emerald400, fontSize = 9.sp)
            }
            Text((if (amount > 0) "+" else "") + amount.asEuro(), color = if (amount >= 0) CasinhaPalette.Emerald600 else CasinhaPalette.Red500, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            IconButton(onClick = onDelete, modifier = Modifier.size(34.dp)) { Icon(Icons.Rounded.DeleteOutline, "Apagar", tint = CasinhaPalette.Emerald200, modifier = Modifier.size(18.dp)) }
        }
    }
}

@Composable
private fun SavingsCard(goal: SavingsGoal, working: Boolean, onDeposit: (SavingsGoal, String) -> Unit, onDelete: () -> Unit) {
    var depositing by remember(goal.id) { mutableStateOf(false) }
    var amount by remember(goal.id) { mutableStateOf("") }
    val progress = if (goal.targetAmount <= 0) 0f else (goal.currentAmount / goal.targetAmount).toFloat()
    GlassCard(modifier = Modifier.fillMaxWidth(), borderColor = CasinhaPalette.Emerald100) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(goal.emoji, fontSize = 27.sp)
                Column(modifier = Modifier.weight(1f).padding(horizontal = 10.dp)) {
                    Text(goal.name, color = CasinhaPalette.Emerald700, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("${goal.currentAmount.asEuro()} / ${goal.targetAmount.asEuro()}", color = CasinhaPalette.Emerald500, fontSize = 10.sp)
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(34.dp)) { Icon(Icons.Rounded.DeleteOutline, "Apagar", tint = CasinhaPalette.Emerald200) }
            }
            CasinhaProgress(progress, CasinhaPalette.Emerald400, Modifier.padding(top = 8.dp), CasinhaPalette.Emerald100)
            if (depositing) {
                Row(modifier = Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                    CasinhaInput(amount, { amount = it }, "Valor €", Modifier.weight(1f), KeyboardType.Decimal)
                    GradientActionButton("Guardar", { onDeposit(goal, amount); depositing = false; amount = "" }, enabled = amount.isNotBlank() && !working, start = CasinhaPalette.Emerald400, end = Color(0xFF2DD4BF))
                }
            } else {
                TextButton(onClick = { depositing = true }, modifier = Modifier.align(Alignment.End)) { Text("+ Depositar", color = CasinhaPalette.Emerald600, fontSize = 11.sp) }
            }
        }
    }
}

@Composable
fun EventsScreen(
    events: List<CasaEvent>,
    working: Boolean,
    error: String?,
    notice: String?,
    onAdd: (String, String, String) -> Unit,
    onToggle: (CasaEvent) -> Unit,
    onDelete: (String) -> Unit,
) {
    var showAdd by remember { mutableStateOf(false) }
    var title by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }
    var guests by remember { mutableStateOf("") }
    val active = events.filterNot { it.done }
    val past = events.filter { it.done }

    Column(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxWidth().background(Color.White.copy(alpha = 0.62f)).padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("🎉 Eventos", color = CasinhaPalette.Rose600, fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Surface(modifier = Modifier.size(36.dp).clickable { showAdd = !showAdd }, shape = CircleShape, color = Color.Transparent) {
                    Box(modifier = Modifier.background(Brush.horizontalGradient(listOf(CasinhaPalette.Pink400, CasinhaPalette.Rose400))), contentAlignment = Alignment.Center) { Icon(Icons.Rounded.Add, "Criar evento", tint = Color.White) }
                }
            }
            if (showAdd) {
                Column(modifier = Modifier.padding(top = 10.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                    CasinhaInput(title, { title = it }, "Nome do evento", Modifier.fillMaxWidth())
                    Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        CasinhaInput(date, { date = it }, "AAAA-MM-DD", Modifier.weight(1f))
                        CasinhaInput(guests, { guests = it }, "Pessoas", Modifier.width(100.dp), KeyboardType.Number)
                    }
                    GradientActionButton("Criar evento", {
                        onAdd(title, date, guests)
                        if (title.isNotBlank()) { title = ""; date = ""; guests = ""; showAdd = false }
                    }, Modifier.fillMaxWidth(), enabled = title.isNotBlank() && !working)
                }
            }
            FeedbackBanner(error, notice, Modifier.padding(top = 8.dp))
        }
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
            if (events.isEmpty()) item { EmptyState("🎉", "Ainda não há eventos") }
            if (active.isNotEmpty()) item { FeatureGroupLabel("Próximos eventos", active.size, CasinhaPalette.Rose500) }
            items(active, key = { it.id }) { event -> EventCard(event, working, onToggle, onDelete) }
            if (past.isNotEmpty()) item { FeatureGroupLabel("Concluídos", past.size, CasinhaPalette.Pink300) }
            items(past, key = { "past-${it.id}" }) { event -> EventCard(event, working, onToggle, onDelete) }
        }
    }
}

@Composable
private fun EventCard(event: CasaEvent, working: Boolean, onToggle: (CasaEvent) -> Unit, onDelete: (String) -> Unit) {
    GlassCard(modifier = Modifier.fillMaxWidth(), borderColor = CasinhaPalette.Rose100) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(modifier = Modifier.size(38.dp).clickable(enabled = !working) { onToggle(event) }, shape = CircleShape, color = if (event.done) CasinhaPalette.Emerald400 else CasinhaPalette.Rose50, border = BorderStroke(1.dp, CasinhaPalette.Rose200)) {
                Box(contentAlignment = Alignment.Center) { if (event.done) Icon(Icons.Rounded.Check, "Reabrir", tint = Color.White) else Text("🎉", fontSize = 19.sp) }
            }
            Column(modifier = Modifier.weight(1f).padding(horizontal = 10.dp)) {
                Text(event.title, color = CasinhaPalette.Rose700, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                if (event.date.isNotBlank()) Text("📅 ${event.date}", color = CasinhaPalette.Pink400, fontSize = 10.sp)
                Text("👥 ${event.participants.size}/${event.guests.coerceAtLeast(event.participants.size)} · ${event.participants.joinToString()}", color = CasinhaPalette.MutedInk, fontSize = 9.sp, maxLines = 1)
            }
            IconButton(onClick = { onDelete(event.id) }, enabled = !working, modifier = Modifier.size(34.dp)) { Icon(Icons.Rounded.DeleteOutline, "Apagar evento", tint = CasinhaPalette.Pink300) }
        }
    }
}

@Composable
fun WeatherScreen(weather: WeatherState, onRefresh: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth().background(Color.White.copy(alpha = 0.62f)).padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("📍 ${weather.location}", color = CasinhaPalette.Rose600, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Text("Leiria · Portugal", color = CasinhaPalette.Pink400, fontSize = 10.sp)
            }
            IconButton(onClick = onRefresh) { Icon(Icons.Rounded.Refresh, "Atualizar tempo", tint = CasinhaPalette.Pink400) }
        }
        if (weather.loading && weather.temperature == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) { Text("🌤️", fontSize = 38.sp); CircularProgressIndicator(color = CasinhaPalette.Pink400, modifier = Modifier.padding(top = 10.dp)) }
            }
            return@Column
        }
        if (weather.error != null && weather.temperature == null) {
            EmptyState("😢", weather.error, Modifier.fillMaxSize())
            return@Column
        }
        val current = weatherVisual(weather.weatherCode ?: -1)
        Column(modifier = Modifier.fillMaxWidth().background(Color.White.copy(alpha = 0.62f)).padding(24.dp)) {
            Text("AGORA", color = CasinhaPalette.Pink400, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
            Row(modifier = Modifier.fillMaxWidth().padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(current.emoji, fontSize = 50.sp)
                Column(modifier = Modifier.padding(start = 14.dp)) {
                    Text("${weather.temperature ?: "–"}°", color = CasinhaPalette.Rose700, fontSize = 38.sp, fontWeight = FontWeight.Bold)
                    Text(current.label, color = CasinhaPalette.Rose500, fontSize = 13.sp)
                }
                Spacer(Modifier.weight(1f))
                Text("💨 ${weather.windSpeed ?: "–"} km/h", color = CasinhaPalette.Pink400, fontSize = 11.sp)
            }
        }
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item { FeatureGroupLabel("PRÓXIMOS DIAS", weather.days.size, CasinhaPalette.Pink400) }
            items(weather.days.drop(1), key = { it.date }) { day ->
                val visual = weatherVisual(day.weatherCode)
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(dayName(day.date), color = CasinhaPalette.Rose600, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.width(86.dp))
                        Text(visual.emoji, fontSize = 22.sp)
                        Text(visual.label, color = CasinhaPalette.Pink400, fontSize = 10.sp, modifier = Modifier.weight(1f).padding(start = 10.dp))
                        if (day.precipitationProbability > 0) Text("💧${day.precipitationProbability}%", color = CasinhaPalette.Blue400, fontSize = 9.sp, modifier = Modifier.padding(end = 10.dp))
                        Text("${day.minimum}° / ${day.maximum}°", color = CasinhaPalette.Rose700, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
fun CalendarScreen(dashboard: DashboardState) {
    var month by remember { mutableStateOf(YearMonth.now()) }
    var selected by remember { mutableStateOf(LocalDate.now()) }
    val first = month.atDay(1)
    val leading = first.dayOfWeek.value - 1
    val cells = List(leading) { null } + (1..month.lengthOfMonth()).map { month.atDay(it) }
    val padded = cells + List((7 - cells.size % 7) % 7) { null }
    val today = LocalDate.now()
    val months = month.month.getDisplayName(TextStyle.FULL, Locale("pt", "PT")).replaceFirstChar { it.titlecase(Locale("pt", "PT")) }
    val dots = calendarEntries(dashboard)
    val selectedEntries = dots[selected.toString()].orEmpty()
    val selectedWeather = dashboard.weather.days.firstOrNull { it.date == selected.toString() }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(modifier = Modifier.fillMaxWidth().background(Color.White.copy(alpha = 0.62f)).padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { month = month.minusMonths(1); selected = month.atDay(1) }) { Icon(Icons.Rounded.ArrowBack, "Mês anterior", tint = CasinhaPalette.Blue400) }
            Text("$months ${month.year}", modifier = Modifier.weight(1f), textAlign = TextAlign.Center, color = CasinhaPalette.Blue600, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            IconButton(onClick = { month = month.plusMonths(1); selected = month.atDay(1) }) { Icon(Icons.Rounded.ArrowForward, "Mês seguinte", tint = CasinhaPalette.Blue400) }
        }
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                Row(modifier = Modifier.fillMaxWidth()) {
                    listOf("Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom").forEach { Text(it, modifier = Modifier.weight(1f), textAlign = TextAlign.Center, color = CasinhaPalette.Blue400, fontSize = 9.sp, fontWeight = FontWeight.Medium) }
                }
            }
            items(padded.chunked(7)) { week ->
                Row(modifier = Modifier.fillMaxWidth()) {
                    week.forEach { date ->
                        if (date == null) Spacer(Modifier.weight(1f).height(52.dp)) else CalendarDay(
                            date = date,
                            selected = date == selected,
                            today = date == today,
                            entries = dots[date.toString()].orEmpty(),
                            weather = dashboard.weather.days.firstOrNull { it.date == date.toString() },
                            modifier = Modifier.weight(1f),
                        ) { selected = date }
                    }
                }
            }
            item {
                Text(selected.format(DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM", Locale("pt", "PT"))).replaceFirstChar { it.titlecase(Locale("pt", "PT")) }, color = CasinhaPalette.Blue600, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 10.dp))
            }
            if (selectedWeather != null) item {
                val visual = weatherVisual(selectedWeather.weatherCode)
                GlassCard(modifier = Modifier.fillMaxWidth(), color = Color(0xFFEFF6FF), borderColor = CasinhaPalette.Blue100) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(visual.emoji, fontSize = 25.sp)
                        Column(modifier = Modifier.weight(1f).padding(start = 10.dp)) { Text(visual.label, color = CasinhaPalette.Blue600, fontWeight = FontWeight.Medium, fontSize = 12.sp); Text("${selectedWeather.minimum}° — ${selectedWeather.maximum}°", color = CasinhaPalette.Blue400, fontSize = 10.sp) }
                        if (selectedWeather.precipitationProbability > 0) Text("💧 ${selectedWeather.precipitationProbability}%", color = CasinhaPalette.Blue400, fontSize = 10.sp)
                    }
                }
            }
            if (selectedEntries.isEmpty() && selectedWeather == null) item { EmptyState("🗓️", "Nada marcado para este dia") }
            items(selectedEntries) { entry ->
                GlassCard(modifier = Modifier.fillMaxWidth(), borderColor = CasinhaPalette.Blue100) {
                    Text(entry, color = CasinhaPalette.Rose700, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
private fun CalendarDay(date: LocalDate, selected: Boolean, today: Boolean, entries: List<String>, weather: WeatherDay?, modifier: Modifier, onClick: () -> Unit) {
    Surface(
        modifier = modifier.height(52.dp).padding(2.dp).clickable(onClick = onClick),
        shape = RoundedCornerShape(11.dp),
        color = when { selected -> CasinhaPalette.Blue400; today -> CasinhaPalette.Blue100; else -> Color.Transparent },
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(date.dayOfMonth.toString(), color = if (selected) Color.White else CasinhaPalette.Blue600, fontSize = 11.sp, fontWeight = if (today) FontWeight.Bold else FontWeight.Normal)
            if (weather != null) Text(weatherVisual(weather.weatherCode).emoji, fontSize = 8.sp)
            if (entries.isNotEmpty()) Text(entries.take(3).joinToString("") { it.take(2) }, fontSize = 7.sp, maxLines = 1)
        }
    }
}

@Composable
private fun FeatureGroupLabel(text: String, count: Int, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(text, color = color, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.7.sp)
        Surface(modifier = Modifier.padding(start = 7.dp), shape = CircleShape, color = color.copy(alpha = 0.12f)) { Text(count.toString(), color = color, fontSize = 9.sp, modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)) }
    }
}

private fun calendarEntries(dashboard: DashboardState): Map<String, List<String>> {
    val result = mutableMapOf<String, MutableList<String>>()
    fun add(date: String?, value: String) {
        if (date.isNullOrBlank()) return
        result.getOrPut(date) { mutableListOf() }.add(value)
    }
    dashboard.events.forEach { add(it.date, "🎉 ${it.title}") }
    dashboard.habitChecks.forEach { check ->
        val habit = dashboard.forSection(HouseSection.HABITS).firstOrNull { it.id == check.habitId }
        add(check.date, "${habit?.emoji ?: "✓"} ${habit?.name ?: "Rotina"}")
    }
    dashboard.forSection(HouseSection.PROJECTS).filter { it.status == "concluido" }.forEach { add(it.completedAt, "🏡 ${it.name}") }
    val year = YearMonth.now().year
    mapOf(
        "$year-01-01" to "🎆 Ano Novo", "$year-04-25" to "🔴 Dia da Liberdade",
        "$year-06-10" to "🇵🇹 Dia de Portugal", "$year-12-25" to "🎁 Natal",
    ).forEach { (date, value) -> add(date, value) }
    return result
}

private fun expenseCategoryEmoji(category: String): String = when (category) {
    "casa" -> "🏠"; "compras" -> "🛒"; "restaurantes" -> "🍜"; "transporte" -> "🚗"
    "lazer" -> "🎉"; "saude" -> "💊"; else -> "🌸"
}

private fun dayName(date: String): String = runCatching {
    val value = LocalDate.parse(date)
    when (value) {
        LocalDate.now().plusDays(1) -> "Amanhã"
        else -> value.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale("pt", "PT")).replaceFirstChar { it.titlecase(Locale("pt", "PT")) }
    }
}.getOrDefault(date)
