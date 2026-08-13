package com.findmucker.casa

import kotlin.math.roundToInt

enum class LootSlot(val key: String, val label: String, val emoji: String) {
    HELMET("helmet", "Cabeça", "👒"),
    WEAPON("weapon", "Arma", "⚔️"),
    SHIELD("shield", "Escudo", "🛡️"),
    ARMOR("armor", "Corpo", "👗"),
    BOOTS("boots", "Pés", "👟"),
    ACCESSORY("accessory", "Acess.", "💍");

    companion object {
        fun fromKey(value: String): LootSlot? = entries.firstOrNull { it.key == value }
    }
}

enum class LootRarity(val key: String, val label: String) {
    COMMON("common", "Comum"),
    RARE("rare", "Raro"),
    EPIC("epic", "Épico"),
    LEGENDARY("legendary", "Lendário");
}

data class LootItem(
    val id: String,
    val name: String,
    val emoji: String,
    val slot: LootSlot,
    val rarity: LootRarity,
    val description: String,
)

data class InventoryItem(val itemId: String, val count: Int)

val CasinhaLoot = listOf(
    LootItem("helm_flower", "Coroa de Flores", "🌸", LootSlot.HELMET, LootRarity.COMMON, "Uma coroa delicada de flores da primavera"),
    LootItem("helm_bunny", "Orelhas de Coelho", "🐰", LootSlot.HELMET, LootRarity.COMMON, "Fofinhas e peludas"),
    LootItem("helm_star", "Tiara Estelar", "⭐", LootSlot.HELMET, LootRarity.RARE, "Brilha com a luz das estrelas"),
    LootItem("helm_crown", "Coroa Real", "👑", LootSlot.HELMET, LootRarity.EPIC, "Digna de realeza doméstica"),
    LootItem("helm_halo", "Auréola Divina", "😇", LootSlot.HELMET, LootRarity.LEGENDARY, "Para quem é um verdadeiro anjo da casa"),
    LootItem("wep_broom", "Vassoura Mágica", "🧹", LootSlot.WEAPON, LootRarity.COMMON, "Limpa e ataca ao mesmo tempo"),
    LootItem("wep_spatula", "Espátula de Chef", "🍳", LootSlot.WEAPON, LootRarity.COMMON, "Arma de cozinheiro destemido"),
    LootItem("wep_wand", "Varinha Fofinha", "🪄", LootSlot.WEAPON, LootRarity.RARE, "Transforma tarefas em diversão"),
    LootItem("wep_hammer", "Martelo Dourado", "🔨", LootSlot.WEAPON, LootRarity.EPIC, "Para projetos épicos"),
    LootItem("wep_trident", "Tridente Lendário", "🔱", LootSlot.WEAPON, LootRarity.LEGENDARY, "Poder supremo do lar"),
    LootItem("shd_cookie", "Escudo de Bolacha", "🍪", LootSlot.SHIELD, LootRarity.COMMON, "Doce proteção"),
    LootItem("shd_leaf", "Escudo Folha", "🍃", LootSlot.SHIELD, LootRarity.COMMON, "Proteção natural"),
    LootItem("shd_heart", "Escudo do Amor", "💖", LootSlot.SHIELD, LootRarity.RARE, "O amor protege de tudo"),
    LootItem("shd_crystal", "Escudo Cristal", "🔮", LootSlot.SHIELD, LootRarity.EPIC, "Reflete energia negativa"),
    LootItem("shd_rainbow", "Escudo Arco-Íris", "🌈", LootSlot.SHIELD, LootRarity.LEGENDARY, "Proteção colorida suprema"),
    LootItem("arm_apron", "Avental Fofo", "👗", LootSlot.ARMOR, LootRarity.COMMON, "Proteção na cozinha"),
    LootItem("arm_sweater", "Camisola Quentinha", "🧶", LootSlot.ARMOR, LootRarity.COMMON, "Conforto é a melhor armadura"),
    LootItem("arm_cape", "Capa de Super-Herói", "🦸", LootSlot.ARMOR, LootRarity.RARE, "Quem arruma a casa é herói"),
    LootItem("arm_armor", "Armadura de Diamante", "💎", LootSlot.ARMOR, LootRarity.EPIC, "Brilhante e indestrutível"),
    LootItem("arm_dragon", "Armadura de Dragão", "🐉", LootSlot.ARMOR, LootRarity.LEGENDARY, "Forjada em fogo de dragão"),
    LootItem("boot_slippers", "Pantufas Fofas", "🧦", LootSlot.BOOTS, LootRarity.COMMON, "Para andar pela casa em conforto"),
    LootItem("boot_garden", "Botas de Jardim", "🌱", LootSlot.BOOTS, LootRarity.COMMON, "Perfeitas para o exterior"),
    LootItem("boot_speed", "Botas de Velocidade", "👟", LootSlot.BOOTS, LootRarity.RARE, "Tarefas feitas num instante"),
    LootItem("boot_cloud", "Botas de Nuvem", "☁️", LootSlot.BOOTS, LootRarity.EPIC, "Anda sobre nuvens"),
    LootItem("boot_rocket", "Botas Foguete", "🚀", LootSlot.BOOTS, LootRarity.LEGENDARY, "Velocidade máxima garantida"),
    LootItem("acc_bell", "Sininho", "🔔", LootSlot.ACCESSORY, LootRarity.COMMON, "Toca quando terminas uma tarefa"),
    LootItem("acc_cat", "Gatinho de Ombro", "🐱", LootSlot.ACCESSORY, LootRarity.COMMON, "Companhia fofinha"),
    LootItem("acc_butterfly", "Borboleta Mágica", "🦋", LootSlot.ACCESSORY, LootRarity.RARE, "Voa ao teu lado"),
    LootItem("acc_fairy", "Fadinha Ajudante", "🧚", LootSlot.ACCESSORY, LootRarity.EPIC, "Ajuda invisível nas tarefas"),
    LootItem("acc_phoenix", "Fénix Miniatura", "🔥", LootSlot.ACCESSORY, LootRarity.LEGENDARY, "Renasce das cinzas da preguiça"),
)

enum class AvatarSlot(val key: String, val label: String, val emoji: String) {
    ANIMAL("animal", "Animal", "🐾"),
    EYES("eyes", "Olhos", "👁️"),
    MOUTH("mouth", "Boca", "👄"),
    TOP("top", "Cima", "👕"),
    BOTTOM("bottom", "Baixo", "👖"),
    ACCESSORY("accessory", "Acess.", "🎀"),
    BACKGROUND("background", "Fundo", "🎨"),
    EFFECT("effect", "Efeitos", "✨"),
}

data class AvatarConfig(
    val animal: Int = 0,
    val eyes: Int = 0,
    val mouth: Int = 0,
    val top: Int = 0,
    val bottom: Int = 0,
    val accessory: Int = 0,
    val background: Int = 0,
    val effect: Int = 0,
) {
    fun value(slot: AvatarSlot): Int = when (slot) {
        AvatarSlot.ANIMAL -> animal
        AvatarSlot.EYES -> eyes
        AvatarSlot.MOUTH -> mouth
        AvatarSlot.TOP -> top
        AvatarSlot.BOTTOM -> bottom
        AvatarSlot.ACCESSORY -> accessory
        AvatarSlot.BACKGROUND -> background
        AvatarSlot.EFFECT -> effect
    }

    fun withValue(slot: AvatarSlot, value: Int): AvatarConfig = when (slot) {
        AvatarSlot.ANIMAL -> copy(animal = value)
        AvatarSlot.EYES -> copy(eyes = value)
        AvatarSlot.MOUTH -> copy(mouth = value)
        AvatarSlot.TOP -> copy(top = value)
        AvatarSlot.BOTTOM -> copy(bottom = value)
        AvatarSlot.ACCESSORY -> copy(accessory = value)
        AvatarSlot.BACKGROUND -> copy(background = value)
        AvatarSlot.EFFECT -> copy(effect = value)
    }

    fun asFirestoreMap(): Map<String, Int> = AvatarSlot.entries.associate { it.key to value(it) }
}

data class AvatarOption(val id: Int, val name: String, val preview: String)

val AvatarOptions = mapOf(
    AvatarSlot.ANIMAL to listOf(
        AvatarOption(0, "Panda", "🐼"), AvatarOption(1, "Gatinho", "🐱"),
        AvatarOption(2, "Coelhinho", "🐰"), AvatarOption(3, "Raposa", "🦊"),
        AvatarOption(4, "Ursinho", "🐻"), AvatarOption(5, "Cãozinho", "🐶"),
        AvatarOption(6, "Pinguim", "🐧"), AvatarOption(7, "Hamster", "🐹"),
        AvatarOption(8, "Coala", "🐨"), AvatarOption(9, "Coruja", "🦉"),
        AvatarOption(10, "Sapinho", "🐸"),
    ),
    AvatarSlot.EYES to listOf("Azul" to "🔵", "Roxo" to "🟣", "Verde" to "🟢", "Vermelho" to "🔴", "Dourado" to "🟡", "Rosa" to "🎀", "Heterocromia" to "👁️").mapIndexed { id, value -> AvatarOption(id, value.first, value.second) },
    AvatarSlot.MOUTH to listOf("Sorriso" to "😊", "Aberto" to "😄", "Gatinho" to "😺", "Surpreso" to "😮", "Tímido" to "😌", "Dentes" to "😁", "Língua" to "😛").mapIndexed { id, value -> AvatarOption(id, value.first, value.second) },
    AvatarSlot.TOP to listOf("Camisola" to "👕", "Uniforme" to "🧥", "Hoodie" to "🧥", "Kimono" to "👘", "Armadura" to "🦺", "Mago" to "🧙", "Marinheiro" to "⚓").mapIndexed { id, value -> AvatarOption(id, value.first, value.second) },
    AvatarSlot.BOTTOM to listOf("Calças" to "👖", "Saia" to "👗", "Shorts" to "🩳", "Kimono" to "🥻", "Armadura" to "🦿", "Mago" to "🧙", "Fluffy" to "🧦").mapIndexed { id, value -> AvatarOption(id, value.first, value.second) },
    AvatarSlot.ACCESSORY to listOf("Nenhum" to "—", "Laço" to "🎀", "Coroa" to "👑", "Chapéu Mago" to "🧙", "Flores" to "🌸", "Óculos" to "👓", "Cachecol" to "🧣").mapIndexed { id, value -> AvatarOption(id, value.first, value.second) },
    AvatarSlot.BACKGROUND to listOf("Floresta" to "🌲", "Oceano" to "🌊", "Deserto" to "🏜️", "Neve" to "❄️", "Vulcão" to "🌋", "Céu" to "☁️", "Espaço" to "🌌").mapIndexed { id, value -> AvatarOption(id, value.first, value.second) },
    AvatarSlot.EFFECT to listOf("Nenhum" to "—", "Estrelas" to "⭐", "Corações" to "💕", "Brilhos" to "✨", "Bolhas" to "🫧", "Neve" to "❄️", "Pixéis" to "🟥").mapIndexed { id, value -> AvatarOption(id, value.first, value.second) },
)

data class RpgStat(val name: String, val emoji: String, val value: Int)

fun rpgStats(profile: GamificationProfile): List<RpgStat> = listOf(
    RpgStat("Força", "⚔️", (profile.projectsDone * 3).coerceAtMost(100)),
    RpgStat("Inteligência", "🧠", (profile.coisinhasDone * 1.5).roundToInt().coerceAtMost(100)),
    RpgStat("Destreza", "🏃", (profile.shoppingDone * 2).coerceAtMost(100)),
    RpgStat("Carisma", "💬", (profile.totalCompleted * 0.5).roundToInt().coerceAtMost(100)),
    RpgStat("Vitalidade", "❤️", (profile.habitsDone * 2).coerceAtMost(100)),
    RpgStat("Sorte", "🍀", (profile.maxStreak * 4).coerceAtMost(100)),
)

fun pendingLootBoxes(profile: GamificationProfile): Int =
    (profile.points / 50 - profile.boxesOpened).coerceAtLeast(0)
