import { doc, getDoc, setDoc, updateDoc, increment, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

export const POINTS = {
  shopping_done: 1,
  coisinha_done: 2,
  project_done: 5,
  habit_check: 2,
  streak_5: 10,
  streak_10: 25,
  streak_30: 100,
} as const;

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: (stats: GameStats) => boolean;
}

export interface GameStats {
  points: number;
  totalCompleted: number;
  maxStreak: number;
  shoppingDone: number;
  coisinhasDone: number;
  projectsDone: number;
  habitsDone: number;
}

export const BADGES: Badge[] = [
  { id: "first_step", name: "Primeiro passo", emoji: "🌱", description: "Completar o primeiro item", condition: (s) => s.totalCompleted >= 1 },
  { id: "on_fire", name: "Em chamas", emoji: "🔥", description: "5 dias de streak", condition: (s) => s.maxStreak >= 5 },
  { id: "unstoppable", name: "Imparável", emoji: "⚡", description: "10 dias de streak", condition: (s) => s.maxStreak >= 10 },
  { id: "legend", name: "Lenda", emoji: "👑", description: "30 dias de streak", condition: (s) => s.maxStreak >= 30 },
  { id: "shopaholic", name: "Compradora", emoji: "🛍️", description: "50 comprinhas feitas", condition: (s) => s.shoppingDone >= 50 },
  { id: "doer", name: "Faz-tudo", emoji: "🦸", description: "25 coisinhas feitas", condition: (s) => s.coisinhasDone >= 25 },
  { id: "architect", name: "Arquiteto", emoji: "🏗️", description: "5 projetinhos concluídos", condition: (s) => s.projectsDone >= 5 },
  { id: "century", name: "Centenário", emoji: "🏆", description: "100 pontos totais", condition: (s) => s.points >= 100 },
  { id: "five_hundred", name: "Top scorer", emoji: "💎", description: "500 pontos totais", condition: (s) => s.points >= 500 },
];

export async function awardPoints(owner: string, amount: number, reason: string) {
  const ref = doc(db, "gamification", owner);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      transaction.set(ref, {
        points: amount,
        totalCompleted: 1,
        maxStreak: 0,
        shoppingDone: reason === "shopping_done" ? 1 : 0,
        coisinhasDone: reason === "coisinha_done" ? 1 : 0,
        projectsDone: reason === "project_done" ? 1 : 0,
        habitsDone: reason === "habit_check" ? 1 : 0,
        badges: [],
        lastAction: reason,
      });
    } else {
      const data = snap.data();
      const updates: Record<string, unknown> = {
        points: (data.points || 0) + amount,
        totalCompleted: (data.totalCompleted || 0) + 1,
        lastAction: reason,
      };
      if (reason === "shopping_done") updates.shoppingDone = (data.shoppingDone || 0) + 1;
      if (reason === "coisinha_done") updates.coisinhasDone = (data.coisinhasDone || 0) + 1;
      if (reason === "project_done") updates.projectsDone = (data.projectsDone || 0) + 1;
      if (reason === "habit_check") updates.habitsDone = (data.habitsDone || 0) + 1;
      transaction.update(ref, updates);
    }
  });
}

export async function updateStreak(owner: string, streak: number) {
  const ref = doc(db, "gamification", owner);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists()) {
      const current = snap.data().maxStreak || 0;
      if (streak > current) {
        transaction.update(ref, { maxStreak: streak });
      }
    }
  });
}

export async function getStats(owner: string): Promise<GameStats> {
  const ref = doc(db, "gamification", owner);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { points: 0, totalCompleted: 0, maxStreak: 0, shoppingDone: 0, coisinhasDone: 0, projectsDone: 0, habitsDone: 0 };
  const data = snap.data();
  return { points: data.points || 0, totalCompleted: data.totalCompleted || 0, maxStreak: data.maxStreak || 0, shoppingDone: data.shoppingDone || 0, coisinhasDone: data.coisinhasDone || 0, projectsDone: data.projectsDone || 0, habitsDone: data.habitsDone || 0 };
}

export function checkNewBadges(stats: GameStats, currentBadges: string[]): Badge[] {
  return BADGES.filter((b) => b.condition(stats) && !currentBadges.includes(b.id));
}

// ─── RPG Profile ────────────────────────────────────────────────

export const TITLES = [
  { level: 1, title: "Aprendiz da Casa" },
  { level: 3, title: "Ajudante Doméstico" },
  { level: 5, title: "Organizador" },
  { level: 7, title: "Mestre das Tarefas" },
  { level: 10, title: "Guardião da Casa" },
  { level: 15, title: "Lenda Doméstica" },
  { level: 20, title: "Rei/Rainha da Casa" },
  { level: 30, title: "Divindade do Lar" },
];

export function getTitle(level: number): string {
  let title = TITLES[0].title;
  for (const t of TITLES) {
    if (level >= t.level) title = t.title;
  }
  return title;
}

export function getLevel(points: number): { level: number; xpInLevel: number; xpForNext: number } {
  const level = Math.floor(points / 50) + 1;
  const xpInLevel = points % 50;
  return { level, xpInLevel, xpForNext: 50 };
}

export interface RPGStat {
  key: string;
  name: string;
  emoji: string;
  value: number;
  maxValue: number;
  description: string;
}

export function calculateStats(stats: GameStats): RPGStat[] {
  return [
    { key: "str", name: "Força", emoji: "⚔️", value: Math.min(stats.projectsDone * 3, 100), maxValue: 100, description: "Projetinhos concluídos" },
    { key: "int", name: "Inteligência", emoji: "🧠", value: Math.min(Math.round(stats.coisinhasDone * 1.5), 100), maxValue: 100, description: "Coisinhas feitas" },
    { key: "dex", name: "Destreza", emoji: "🏃", value: Math.min(stats.shoppingDone * 2, 100), maxValue: 100, description: "Comprinhas feitas" },
    { key: "cha", name: "Carisma", emoji: "💬", value: Math.min(Math.round(stats.totalCompleted * 0.5), 100), maxValue: 100, description: "Colaboração total" },
    { key: "vit", name: "Vitalidade", emoji: "❤️", value: Math.min((stats.habitsDone || 0) * 2, 100), maxValue: 100, description: "Hábitos completados" },
    { key: "lck", name: "Sorte", emoji: "🍀", value: Math.min(stats.maxStreak * 4, 100), maxValue: 100, description: "Melhor streak" },
  ];
}

export interface Equipment {
  slot: string;
  name: string;
  emoji: string;
  lockedEmoji: string;
  description: string;
  condition: (stats: GameStats, level: number) => boolean;
}

export const EQUIPMENT: Equipment[] = [
  { slot: "weapon", name: "Espada do Construtor", emoji: "🗡️", lockedEmoji: "❓", description: "Completar 3 projetinhos", condition: (s) => s.projectsDone >= 3 },
  { slot: "shield", name: "Escudo da Consistência", emoji: "🛡️", lockedEmoji: "❓", description: "10 dias de streak", condition: (s) => s.maxStreak >= 10 },
  { slot: "crown", name: "Coroa Real", emoji: "👑", lockedEmoji: "❓", description: "Atingir nível 10", condition: (_, l) => l >= 10 },
  { slot: "gloves", name: "Luvas do Faz-Tudo", emoji: "🧤", lockedEmoji: "❓", description: "50 coisinhas feitas", condition: (s) => s.coisinhasDone >= 50 },
  { slot: "boots", name: "Botas do Maratonista", emoji: "👟", lockedEmoji: "❓", description: "30 comprinhas feitas", condition: (s) => s.shoppingDone >= 30 },
  { slot: "ring", name: "Anel da Comunidade", emoji: "💍", lockedEmoji: "❓", description: "100 pontos totais", condition: (s) => s.points >= 100 },
];

// ─── Rewards & Loot ────────────────────────────────────────────

export interface Reward {
  id: string;
  name: string;
  emoji: string;
  description: string;
  xp: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  trigger: string; // which action triggers this
}

export const LOOT_TABLE: Reward[] = [
  { id: "potion_xp", name: "Poção de XP", emoji: "🧪", description: "+10 XP bónus", xp: 10, rarity: "common", trigger: "shopping_done" },
  { id: "scroll_wisdom", name: "Pergaminho de Sabedoria", emoji: "📜", description: "+15 XP bónus", xp: 15, rarity: "common", trigger: "coisinha_done" },
  { id: "gem_power", name: "Gema de Poder", emoji: "💎", description: "+25 XP bónus", xp: 25, rarity: "rare", trigger: "project_done" },
  { id: "elixir_streak", name: "Elixir de Fogo", emoji: "🔮", description: "+30 XP por streak", xp: 30, rarity: "rare", trigger: "streak_5" },
  { id: "crown_shard", name: "Fragmento de Coroa", emoji: "✨", description: "+50 XP épico", xp: 50, rarity: "epic", trigger: "streak_10" },
  { id: "star_legendary", name: "Estrela Lendária", emoji: "🌟", description: "+100 XP lendário", xp: 100, rarity: "legendary", trigger: "streak_30" },
];

export function rollLoot(trigger: string): Reward | null {
  const possible = LOOT_TABLE.filter((r) => r.trigger === trigger);
  if (possible.length === 0) return null;
  // Drop chance: common 40%, rare 20%, epic 10%, legendary 5%
  const chances: Record<string, number> = { common: 0.4, rare: 0.2, epic: 0.1, legendary: 0.05 };
  const roll = Math.random();
  for (const reward of possible) {
    if (roll < (chances[reward.rarity] || 0)) return reward;
  }
  return null;
}

// ─── Loot Box System ──────────────────────────────────────────

export type LootSlot = "helmet" | "weapon" | "shield" | "armor" | "boots" | "accessory";

export interface LootItem {
  id: string;
  name: string;
  emoji: string;
  slot: LootSlot;
  rarity: "common" | "rare" | "epic" | "legendary";
  description: string;
}

export interface InventoryItem {
  itemId: string;
  count: number;
}

export interface EquippedItems {
  helmet?: string;
  weapon?: string;
  shield?: string;
  armor?: string;
  boots?: string;
  accessory?: string;
}

export const LOOT_POOL: LootItem[] = [
  // Helmets
  { id: "helm_flower", name: "Coroa de Flores", emoji: "🌸", slot: "helmet", rarity: "common", description: "Uma coroa delicada de flores da primavera" },
  { id: "helm_bunny", name: "Orelhas de Coelho", emoji: "🐰", slot: "helmet", rarity: "common", description: "Fofinhas e peludas" },
  { id: "helm_star", name: "Tiara Estelar", emoji: "⭐", slot: "helmet", rarity: "rare", description: "Brilha com a luz das estrelas" },
  { id: "helm_crown", name: "Coroa Real", emoji: "👑", slot: "helmet", rarity: "epic", description: "Digna de realeza doméstica" },
  { id: "helm_halo", name: "Auréola Divina", emoji: "😇", slot: "helmet", rarity: "legendary", description: "Para quem é um verdadeiro anjo da casa" },
  // Weapons
  { id: "wep_broom", name: "Vassoura Mágica", emoji: "🧹", slot: "weapon", rarity: "common", description: "Limpa e ataca ao mesmo tempo" },
  { id: "wep_spatula", name: "Espátula de Chef", emoji: "🍳", slot: "weapon", rarity: "common", description: "Arma de cozinheiro destemido" },
  { id: "wep_wand", name: "Varinha Fofinha", emoji: "🪄", slot: "weapon", rarity: "rare", description: "Transforma tarefas em diversão" },
  { id: "wep_hammer", name: "Martelo Dourado", emoji: "🔨", slot: "weapon", rarity: "epic", description: "Para projetos épicos" },
  { id: "wep_trident", name: "Tridente Lendário", emoji: "🔱", slot: "weapon", rarity: "legendary", description: "Poder supremo do lar" },
  // Shields
  { id: "shd_cookie", name: "Escudo de Bolacha", emoji: "🍪", slot: "shield", rarity: "common", description: "Doce proteção" },
  { id: "shd_leaf", name: "Escudo Folha", emoji: "🍃", slot: "shield", rarity: "common", description: "Proteção natural" },
  { id: "shd_heart", name: "Escudo do Amor", emoji: "💖", slot: "shield", rarity: "rare", description: "O amor protege de tudo" },
  { id: "shd_crystal", name: "Escudo Cristal", emoji: "🔮", slot: "shield", rarity: "epic", description: "Reflete energia negativa" },
  { id: "shd_rainbow", name: "Escudo Arco-Íris", emoji: "🌈", slot: "shield", rarity: "legendary", description: "Proteção colorida suprema" },
  // Armor
  { id: "arm_apron", name: "Avental Fofo", emoji: "👗", slot: "armor", rarity: "common", description: "Proteção na cozinha" },
  { id: "arm_sweater", name: "Camisola Quentinha", emoji: "🧶", slot: "armor", rarity: "common", description: "Conforto é a melhor armadura" },
  { id: "arm_cape", name: "Capa de Super-Herói", emoji: "🦸", slot: "armor", rarity: "rare", description: "Quem arruma a casa é herói" },
  { id: "arm_armor", name: "Armadura de Diamante", emoji: "💎", slot: "armor", rarity: "epic", description: "Brilhante e indestrutível" },
  { id: "arm_dragon", name: "Armadura de Dragão", emoji: "🐉", slot: "armor", rarity: "legendary", description: "Forjada em fogo de dragão" },
  // Boots
  { id: "boot_slippers", name: "Pantufas Fofas", emoji: "🧦", slot: "boots", rarity: "common", description: "Para andar pela casa em conforto" },
  { id: "boot_garden", name: "Botas de Jardim", emoji: "🌱", slot: "boots", rarity: "common", description: "Perfeitas para o exterior" },
  { id: "boot_speed", name: "Botas de Velocidade", emoji: "👟", slot: "boots", rarity: "rare", description: "Tarefas feitas num instante" },
  { id: "boot_cloud", name: "Botas de Nuvem", emoji: "☁️", slot: "boots", rarity: "epic", description: "Anda sobre nuvens" },
  { id: "boot_rocket", name: "Botas Foguete", emoji: "🚀", slot: "boots", rarity: "legendary", description: "Velocidade máxima garantida" },
  // Accessories
  { id: "acc_bell", name: "Sininho", emoji: "🔔", slot: "accessory", rarity: "common", description: "Toca quando terminas uma tarefa" },
  { id: "acc_cat", name: "Gatinho de Ombro", emoji: "🐱", slot: "accessory", rarity: "common", description: "Companhia fofinha" },
  { id: "acc_butterfly", name: "Borboleta Mágica", emoji: "🦋", slot: "accessory", rarity: "rare", description: "Voa ao teu lado" },
  { id: "acc_fairy", name: "Fadinha Ajudante", emoji: "🧚", slot: "accessory", rarity: "epic", description: "Ajuda invisível nas tarefas" },
  { id: "acc_phoenix", name: "Fénix Miniatura", emoji: "🔥", slot: "accessory", rarity: "legendary", description: "Renasce das cinzas da preguiça" },
];

const RARITY_WEIGHTS: Record<string, number> = { common: 50, rare: 30, epic: 15, legendary: 5 };

export function rollLootBox(): LootItem {
  // Weighted random: pick rarity first, then random item of that rarity
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let selectedRarity: string = "common";
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) { selectedRarity = rarity; break; }
  }
  const pool = LOOT_POOL.filter((i) => i.rarity === selectedRarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getPendingBoxes(points: number, boxesOpened: number): number {
  return Math.max(0, Math.floor(points / 50) - boxesOpened);
}

const DUPLICATE_XP: Record<string, number> = { legendary: 50, epic: 30, rare: 15, common: 5 };

export interface LootBoxResult {
  item: LootItem;
  isDuplicate: boolean;
  xpGained: number;
}

export async function openLootBox(owner: string): Promise<LootBoxResult | null> {
  const ref = doc(db, "gamification", owner);
  const item = rollLootBox();

  return await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return null;

    const data = snap.data();
    const points = data.points || 0;
    const boxesOpened = data.boxesOpened || 0;
    const pending = getPendingBoxes(points, boxesOpened);
    if (pending <= 0) return null;

    const inventory: InventoryItem[] = data.inventory || [];
    const existing = inventory.find((i) => i.itemId === item.id);

    if (existing) {
      // Duplicate — convert to XP
      const xpGained = DUPLICATE_XP[item.rarity] || 5;
      transaction.update(ref, {
        boxesOpened: boxesOpened + 1,
        points: points + xpGained,
      });
      return { item, isDuplicate: true, xpGained };
    } else {
      // New item — add to inventory
      inventory.push({ itemId: item.id, count: 1 });
      transaction.update(ref, { boxesOpened: boxesOpened + 1, inventory });
      return { item, isDuplicate: false, xpGained: 0 };
    }
  });
}

export async function equipItem(owner: string, itemId: string, slot: LootSlot): Promise<void> {
  const ref = doc(db, "gamification", owner);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;
    const equipped: EquippedItems = snap.data().equipped || {};
    equipped[slot] = itemId;
    transaction.update(ref, { equipped });
  });
}

export async function unequipItem(owner: string, slot: LootSlot): Promise<void> {
  const ref = doc(db, "gamification", owner);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;
    const equipped: EquippedItems = snap.data().equipped || {};
    delete equipped[slot];
    transaction.update(ref, { equipped });
  });
}

// ─── Level Up System ───────────────────────────────────────────

export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  newTitle: string;
  unlockedEquipment: Equipment[];
  lootDrop: Reward | null;
}

export function checkLevelUp(oldPoints: number, newPoints: number, stats: GameStats, trigger: string): LevelUpResult {
  const oldLevel = getLevel(oldPoints).level;
  const newLevel = getLevel(newPoints).level;
  const leveledUp = newLevel > oldLevel;

  const unlockedEquipment = leveledUp
    ? EQUIPMENT.filter((eq) => eq.condition(stats, newLevel) && !eq.condition(stats, oldLevel))
    : [];

  const lootDrop = rollLoot(trigger);

  return {
    leveledUp,
    oldLevel,
    newLevel,
    newTitle: getTitle(newLevel),
    unlockedEquipment,
    lootDrop,
  };
}

export async function awardXPWithRewards(owner: string, baseAmount: number, reason: string): Promise<LevelUpResult> {
  const ref = doc(db, "gamification", owner);
  // Get old points before awarding
  const snap = await getDoc(ref);
  const oldPoints = snap.exists() ? (snap.data().points || 0) : 0;

  // Award base points (atomic)
  await awardPoints(owner, baseAmount, reason);

  // Check for loot/level up
  const newStats = await getStats(owner);
  const result = checkLevelUp(oldPoints, newStats.points, newStats, reason);

  // If loot dropped, award bonus XP (atomic)
  if (result.lootDrop) {
    await awardPoints(owner, result.lootDrop.xp, `loot_${result.lootDrop.id}`);
  }

  return result;
}

