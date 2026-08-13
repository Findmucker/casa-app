package com.findmucker.casa

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private data class Achievement(
    val id: String,
    val name: String,
    val emoji: String,
    val description: String,
    val earned: (GamificationProfile) -> Boolean,
)

private val achievements = listOf(
    Achievement("first_step", "Primeiro passo", "🌱", "Completar o primeiro item") { it.totalCompleted >= 1 },
    Achievement("on_fire", "Em chamas", "🔥", "5 dias de streak") { it.maxStreak >= 5 },
    Achievement("unstoppable", "Imparável", "⚡", "10 dias de streak") { it.maxStreak >= 10 },
    Achievement("legend", "Lenda", "👑", "30 dias de streak") { it.maxStreak >= 30 },
    Achievement("shopaholic", "Compradora", "🛒", "50 comprinhas feitas") { it.shoppingDone >= 50 },
    Achievement("doer", "Faz-tudo", "🦸", "25 coisinhas feitas") { it.coisinhasDone >= 25 },
    Achievement("architect", "Arquiteto", "🏗️", "5 projetos concluídos") { it.projectsDone >= 5 },
    Achievement("century", "Centenário", "🏆", "100 pontos totais") { it.points >= 100 },
    Achievement("five_hundred", "Top scorer", "💎", "500 pontos totais") { it.points >= 500 },
)

@Composable
fun AvatarCharacter(
    avatar: AvatarConfig,
    equipped: Map<LootSlot, String> = emptyMap(),
    modifier: Modifier = Modifier,
    compact: Boolean = false,
) {
    val background = listOf(
        listOf(Color(0xFF0D3B1E), Color(0xFF1A5C32)),
        listOf(Color(0xFF0A1E3D), Color(0xFF1A4A7A)),
        listOf(Color(0xFF4A3A1A), Color(0xFFC2956B)),
        listOf(Color(0xFFB8D4E8), Color(0xFFE8F0F8)),
        listOf(Color(0xFF1A0505), Color(0xFF4A1A0A)),
        listOf(Color(0xFF87CEEB), Color(0xFFE0F0FF)),
        listOf(Color(0xFF05050F), Color(0xFF1A1A3D)),
    )[avatar.background.coerceIn(0, 6)]
    val animal = AvatarOptions.getValue(AvatarSlot.ANIMAL)
        .firstOrNull { it.id == avatar.animal }?.preview ?: "🐼"
    val accessory = AvatarOptions.getValue(AvatarSlot.ACCESSORY)
        .firstOrNull { it.id == avatar.accessory }?.preview?.takeUnless { it == "—" }
    val effect = AvatarOptions.getValue(AvatarSlot.EFFECT)
        .firstOrNull { it.id == avatar.effect }?.preview?.takeUnless { it == "—" }
    Box(
        modifier = modifier
            .clip(if (compact) CircleShape else RoundedCornerShape(18.dp))
            .background(Brush.verticalGradient(background)),
        contentAlignment = Alignment.Center,
    ) {
        if (effect != null) Text(effect, fontSize = if (compact) 22.sp else 52.sp, color = Color.White.copy(alpha = 0.5f))
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            if (accessory != null) Text(accessory, fontSize = if (compact) 12.sp else 25.sp)
            Text(animal, fontSize = if (compact) 30.sp else 77.sp)
            if (!compact) {
                Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                    val clothing = listOf(
                        AvatarOptions.getValue(AvatarSlot.TOP).getOrNull(avatar.top)?.preview,
                        AvatarOptions.getValue(AvatarSlot.BOTTOM).getOrNull(avatar.bottom)?.preview,
                    ).filterNotNull()
                    clothing.forEach { Text(it, fontSize = 19.sp) }
                }
            }
        }
        val loot = equipped.values.mapNotNull { id -> CasinhaLoot.firstOrNull { it.id == id } }
        if (loot.isNotEmpty()) {
            Row(
                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = if (compact) 1.dp else 8.dp),
                horizontalArrangement = Arrangement.spacedBy(2.dp),
            ) { loot.take(if (compact) 2 else 6).forEach { Text(it.emoji, fontSize = if (compact) 10.sp else 18.sp) } }
        }
    }
}

@Composable
fun GamificationStatsTab(profile: GamificationProfile) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("ATRIBUTOS", color = CasinhaPalette.Purple600, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        rpgStats(profile).forEach { stat ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(stat.emoji, fontSize = 20.sp, modifier = Modifier.width(30.dp), textAlign = TextAlign.Center)
                Column(modifier = Modifier.weight(1f).padding(start = 7.dp)) {
                    Row(modifier = Modifier.fillMaxWidth()) {
                        Text(stat.name, color = CasinhaPalette.Rose700, fontSize = 11.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
                        Text("${stat.value}/100", color = CasinhaPalette.Purple600, fontSize = 10.sp)
                    }
                    CasinhaProgress(stat.value / 100f, CasinhaPalette.Purple400, Modifier.padding(top = 3.dp), height = 7)
                }
            }
        }
        Text("CONQUISTAS", color = CasinhaPalette.Purple600, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
        achievements.chunked(3).forEach { group ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                group.forEach { badge ->
                    val earned = badge.id in profile.badges || badge.earned(profile)
                    Surface(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(13.dp),
                        color = Color.White.copy(alpha = if (earned) 0.82f else 0.42f),
                        border = BorderStroke(1.dp, if (earned) CasinhaPalette.Rose200 else CasinhaPalette.Purple100),
                    ) {
                        Column(modifier = Modifier.padding(7.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(if (earned) badge.emoji else "🔒", fontSize = 21.sp)
                            Text(badge.name, color = CasinhaPalette.Rose700.copy(alpha = if (earned) 1f else 0.55f), fontSize = 9.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
                            Text(badge.description, color = CasinhaPalette.Purple500.copy(alpha = if (earned) 1f else 0.55f), fontSize = 7.sp, textAlign = TextAlign.Center)
                        }
                    }
                }
                repeat(3 - group.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}

@Composable
fun InventoryProfileTab(
    profile: GamificationProfile,
    working: Boolean,
    readOnly: Boolean = false,
    onEquip: (String, LootSlot) -> Unit = { _, _ -> },
    onUnequip: (LootSlot) -> Unit = {},
    onOpenBox: () -> Unit = {},
) {
    var filter by remember { mutableStateOf<LootSlot?>(null) }
    val owned = profile.inventory.mapNotNull { inventory ->
        CasinhaLoot.firstOrNull { it.id == inventory.itemId }?.let { it to inventory.count }
    }.filter { filter == null || it.first.slot == filter }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (!readOnly && pendingLootBoxes(profile) > 0) {
            GlassCard(modifier = Modifier.fillMaxWidth(), borderColor = CasinhaPalette.Purple200) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🎁", fontSize = 32.sp)
                    Column(modifier = Modifier.weight(1f).padding(horizontal = 10.dp)) {
                        Text("${pendingLootBoxes(profile)} caixa(s) por abrir", color = CasinhaPalette.Rose700, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text("Cada 50 XP desbloqueia uma recompensa", color = CasinhaPalette.Purple500, fontSize = 9.sp)
                    }
                    GradientActionButton("Abrir", onOpenBox, enabled = !working)
                }
            }
        }
        GlassCard(modifier = Modifier.fillMaxWidth(), borderColor = CasinhaPalette.Rose200) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text("EQUIPAMENTO", color = CasinhaPalette.Rose600, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                AvatarCharacter(profile.avatar, profile.equipped, Modifier.size(150.dp).padding(top = 8.dp))
                LootSlot.entries.chunked(3).forEach { slots ->
                    Row(modifier = Modifier.fillMaxWidth().padding(top = 7.dp), horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        slots.forEach { slot ->
                            val item = profile.equipped[slot]?.let { id -> CasinhaLoot.firstOrNull { it.id == id } }
                            Surface(
                                modifier = Modifier.weight(1f).clickable(enabled = !readOnly && item != null) { onUnequip(slot) },
                                shape = RoundedCornerShape(11.dp),
                                color = CasinhaPalette.Pink50,
                                border = BorderStroke(1.dp, CasinhaPalette.Pink200),
                            ) {
                                Column(modifier = Modifier.padding(7.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(item?.emoji ?: slot.emoji, fontSize = 20.sp)
                                    Text(item?.name ?: slot.label, color = if (item == null) CasinhaPalette.Pink300 else CasinhaPalette.Purple600, fontSize = 8.sp, maxLines = 1)
                                }
                            }
                        }
                    }
                }
                Text("Nv. ${levelForPoints(profile.points)}  ·  ${profile.points} pts  ·  ${profile.totalCompleted} feitos", color = CasinhaPalette.Purple500, fontSize = 9.sp, modifier = Modifier.padding(top = 9.dp))
            }
        }
        Row(modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
            (listOf<LootSlot?>(null) + LootSlot.entries).forEach { slot ->
                val selected = filter == slot
                Surface(
                    modifier = Modifier.clickable { filter = slot },
                    shape = CircleShape,
                    color = if (selected) CasinhaPalette.Rose500 else Color.White.copy(alpha = 0.7f),
                    border = BorderStroke(1.dp, if (selected) CasinhaPalette.Rose400 else CasinhaPalette.Purple200),
                ) {
                    Text(if (slot == null) "🎒 Todos" else "${slot.emoji} ${slot.label}", color = if (selected) Color.White else CasinhaPalette.Purple600, fontSize = 9.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp))
                }
            }
        }
        if (owned.isEmpty()) {
            Text("Nenhum item neste slot ainda...", color = CasinhaPalette.Purple400, fontSize = 11.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp))
        } else {
            owned.chunked(4).forEach { group ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    group.forEach { (item, count) ->
                        val equipped = profile.equipped[item.slot] == item.id
                        val border = when (item.rarity) {
                            LootRarity.COMMON -> CasinhaPalette.Emerald400
                            LootRarity.RARE -> CasinhaPalette.Blue400
                            LootRarity.EPIC -> CasinhaPalette.Purple400
                            LootRarity.LEGENDARY -> CasinhaPalette.Amber500
                        }
                        Surface(
                            modifier = Modifier.weight(1f).clickable(enabled = !readOnly) {
                                if (equipped) onUnequip(item.slot) else onEquip(item.id, item.slot)
                            },
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White.copy(alpha = 0.76f),
                            border = BorderStroke(if (equipped) 2.dp else 1.dp, border),
                        ) {
                            Column(modifier = Modifier.padding(7.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(if (equipped) "✨${item.emoji}" else item.emoji, fontSize = 23.sp)
                                Text(item.name, color = CasinhaPalette.Purple600, fontSize = 8.sp, textAlign = TextAlign.Center, maxLines = 2)
                                if (count > 1) Text("x$count", color = CasinhaPalette.Rose500, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    repeat(4 - group.size) { Spacer(Modifier.weight(1f)) }
                }
            }
        }
    }
}

@Composable
fun AvatarEditor(
    savedAvatar: AvatarConfig,
    working: Boolean,
    onSave: (AvatarConfig) -> Unit,
) {
    var avatar by remember(savedAvatar) { mutableStateOf(savedAvatar) }
    var activeSlot by remember { mutableStateOf(AvatarSlot.ANIMAL) }
    val options = AvatarOptions.getValue(activeSlot)
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        AvatarCharacter(avatar, modifier = Modifier.fillMaxWidth().height(255.dp))
        Row(modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
            AvatarSlot.entries.forEach { slot ->
                val selected = activeSlot == slot
                Surface(
                    modifier = Modifier.clickable { activeSlot = slot },
                    shape = RoundedCornerShape(10.dp),
                    color = if (selected) CasinhaPalette.Rose400 else Color.White.copy(alpha = 0.7f),
                    border = BorderStroke(1.dp, if (selected) CasinhaPalette.Rose300 else CasinhaPalette.Purple200),
                ) {
                    Text("${slot.emoji} ${slot.label}", color = if (selected) Color.White else CasinhaPalette.Purple600, fontSize = 9.sp, modifier = Modifier.padding(horizontal = 9.dp, vertical = 7.dp))
                }
            }
        }
        options.chunked(4).forEach { group ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                group.forEach { option ->
                    val selected = avatar.value(activeSlot) == option.id
                    Surface(
                        modifier = Modifier.weight(1f).clickable { avatar = avatar.withValue(activeSlot, option.id) },
                        shape = RoundedCornerShape(12.dp),
                        color = if (selected) CasinhaPalette.Rose50 else Color.White.copy(alpha = 0.68f),
                        border = BorderStroke(if (selected) 2.dp else 1.dp, if (selected) CasinhaPalette.Rose400 else CasinhaPalette.Purple200),
                    ) {
                        Column(modifier = Modifier.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(option.preview, fontSize = 25.sp)
                            Text(option.name, color = CasinhaPalette.Purple600, fontSize = 8.sp, textAlign = TextAlign.Center, maxLines = 1)
                        }
                    }
                }
                repeat(4 - group.size) { Spacer(Modifier.weight(1f)) }
            }
        }
        GradientActionButton("✨ Guardar Avatar", { onSave(avatar) }, Modifier.fillMaxWidth(), enabled = !working)
    }
}
