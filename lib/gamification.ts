import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
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
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { points: amount, totalCompleted: 1, maxStreak: 0, shoppingDone: 0, coisinhasDone: 0, projectsDone: 0, badges: [], lastAction: reason });
  } else {
    const updates: Record<string, unknown> = { points: increment(amount), totalCompleted: increment(1), lastAction: reason };
    if (reason === "shopping_done") updates.shoppingDone = increment(1);
    if (reason === "coisinha_done") updates.coisinhasDone = increment(1);
    if (reason === "project_done") updates.projectsDone = increment(1);
    await updateDoc(ref, updates);
  }
}

export async function updateStreak(owner: string, streak: number) {
  const ref = doc(db, "gamification", owner);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const current = snap.data().maxStreak || 0;
    if (streak > current) {
      await updateDoc(ref, { maxStreak: streak });
    }
  }
}

export async function getStats(owner: string): Promise<GameStats> {
  const ref = doc(db, "gamification", owner);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { points: 0, totalCompleted: 0, maxStreak: 0, shoppingDone: 0, coisinhasDone: 0, projectsDone: 0 };
  return snap.data() as GameStats;
}

export function checkNewBadges(stats: GameStats, currentBadges: string[]): Badge[] {
  return BADGES.filter((b) => b.condition(stats) && !currentBadges.includes(b.id));
}
