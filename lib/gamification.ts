import { doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: (stats: GameStats) => boolean;
}

export interface GameStats {
  totalCompleted: number;
  maxStreak: number;
  shoppingDone: number;
  coisinhasDone: number;
  projectsDone: number;
  habitsDone: number;
}

export type CompletedAction =
  | "shopping_done"
  | "coisinha_done"
  | "project_done"
  | "habit_check";

export function activityStatsFromData(data?: Record<string, unknown>): GameStats {
  const count = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;
  return {
    totalCompleted: count(data?.totalCompleted),
    maxStreak: count(data?.maxStreak),
    shoppingDone: count(data?.shoppingDone),
    coisinhasDone: count(data?.coisinhasDone),
    projectsDone: count(data?.projectsDone),
    habitsDone: count(data?.habitsDone),
  };
}

export const BADGES: Badge[] = [
  { id: "first_step", name: "Primeiro passo", emoji: "🌱", description: "Completar o primeiro item", condition: (s) => s.totalCompleted >= 1 },
  { id: "on_fire", name: "Em chamas", emoji: "🔥", description: "5 dias de streak", condition: (s) => s.maxStreak >= 5 },
  { id: "unstoppable", name: "Imparável", emoji: "⚡", description: "10 dias de streak", condition: (s) => s.maxStreak >= 10 },
  { id: "legend", name: "Lenda", emoji: "👑", description: "30 dias de streak", condition: (s) => s.maxStreak >= 30 },
  { id: "shopaholic", name: "Compradora", emoji: "🛍️", description: "50 comprinhas feitas", condition: (s) => s.shoppingDone >= 50 },
  { id: "doer", name: "Faz-tudo", emoji: "🦸", description: "25 coisinhas feitas", condition: (s) => s.coisinhasDone >= 25 },
  { id: "architect", name: "Arquiteto", emoji: "🏗️", description: "5 projetinhos concluídos", condition: (s) => s.projectsDone >= 5 },
];

export async function recordCompletedAction(owner: string, reason: CompletedAction) {
  const ref = doc(db, "gamification", owner);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      transaction.set(ref, {
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

export function checkNewBadges(stats: GameStats, currentBadges: string[]): Badge[] {
  return BADGES.filter((b) => b.condition(stats) && !currentBadges.includes(b.id));
}

// ─── Activity profile ───────────────────────────────────────────

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
    { key: "str", name: "Força", emoji: "⚔️", value: Math.min(stats.projectsDone * 3, 100), maxValue: 100, description: "Projetos concluídos" },
    { key: "int", name: "Inteligência", emoji: "🧠", value: Math.min(Math.round(stats.coisinhasDone * 1.5), 100), maxValue: 100, description: "Coisinhas feitas" },
    { key: "dex", name: "Destreza", emoji: "🏃", value: Math.min(stats.shoppingDone * 2, 100), maxValue: 100, description: "Compras feitas" },
    { key: "cha", name: "Carisma", emoji: "💬", value: Math.min(Math.round(stats.totalCompleted * 0.5), 100), maxValue: 100, description: "Colaboração total" },
    { key: "vit", name: "Vitalidade", emoji: "❤️", value: Math.min((stats.habitsDone || 0) * 2, 100), maxValue: 100, description: "Hábitos completados" },
    { key: "lck", name: "Sorte", emoji: "🍀", value: Math.min(stats.maxStreak * 4, 100), maxValue: 100, description: "Melhor streak" },
  ];
}

// ─── Inventory ─────────────────────────────────────────────────

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

