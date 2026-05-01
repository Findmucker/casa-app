// One-time seed script for test account oxtony350
// Run this in the browser console or import in MaintenancePanel

import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Seeds a fully maxed-out gamification profile for testing.
 * Call with the user's displayName or identifier used as gamification owner.
 */
export async function seedTestAccount(owner: string, houseId: string) {
  // 1. Gamification stats - maxed out
  await setDoc(doc(db, "gamification", owner), {
    points: 750,
    totalCompleted: 200,
    maxStreak: 35,
    shoppingDone: 80,
    coisinhasDone: 60,
    projectsDone: 15,
    badges: [
      "first_step", "on_fire", "unstoppable", "legend",
      "shopaholic", "doer", "architect", "century", "five_hundred"
    ],
    lastAction: "seed_test",
    boxesOpened: 12,
    inventory: [
      { itemId: "helm_crown", count: 1 },
      { itemId: "helm_flower", count: 2 },
      { itemId: "wep_hammer", count: 1 },
      { itemId: "wep_broom", count: 3 },
      { itemId: "shd_heart", count: 1 },
      { itemId: "shd_rainbow", count: 1 },
      { itemId: "arm_cape", count: 1 },
      { itemId: "arm_dragon", count: 1 },
      { itemId: "boot_cloud", count: 1 },
      { itemId: "boot_slippers", count: 2 },
      { itemId: "acc_fairy", count: 1 },
      { itemId: "acc_phoenix", count: 1 },
      { itemId: "acc_cat", count: 2 },
    ],
    equipped: {
      helmet: "helm_crown",
      weapon: "wep_hammer",
      shield: "shd_rainbow",
      armor: "arm_dragon",
      boots: "boot_cloud",
      accessory: "acc_phoenix",
    },
  });

  // 2. Sample shopping items
  const shoppingItems = [
    { name: "Leite", addedBy: owner, done: false, urgent: false, category: "🥛 Frescos", createdAt: new Date() },
    { name: "Frango", addedBy: owner, done: false, urgent: true, category: "🥩 Carnes & Peixe", createdAt: new Date() },
    { name: "Bananas", addedBy: owner, done: true, urgent: false, category: "🥬 Frutas & Legumes", completedAt: "2026-04-30", createdAt: new Date() },
    { name: "Pão", addedBy: owner, done: false, urgent: false, category: "🍞 Padaria & Cereais", createdAt: new Date() },
    { name: "Chocolate", addedBy: owner, done: false, urgent: true, category: "🍫 Snacks", createdAt: new Date() },
    { name: "Detergente", addedBy: owner, done: true, urgent: false, category: "🧴 Higiene & Limpeza", completedAt: "2026-04-29", createdAt: new Date() },
  ];

  for (let i = 0; i < shoppingItems.length; i++) {
    await setDoc(doc(db, "houses", houseId, "shopping", `seed_${i}`), shoppingItems[i]);
  }

  // 3. Sample coisinhas
  const coisinhas = [
    { name: "Comprar aspirador novo", done: true, order: 1, category: "🏠 Casa & Conforto", assignee: "ambos", completedAt: "2026-04-28", createdAt: new Date() },
    { name: "Organizar armário", done: false, order: 2, category: "🗄️ Organização", assignee: "ambos", createdAt: new Date() },
    { name: "Trocar lâmpada cozinha", done: true, order: 3, category: "🔧 Arranjos & Bricolage", completedAt: "2026-04-27", createdAt: new Date() },
    { name: "Comprar vasos novos", done: false, order: 4, category: "🌿 Jardim & Varanda", createdAt: new Date() },
    { name: "Marcar veterinário", done: false, order: 5, category: "📋 Tarefazinhas", createdAt: new Date() },
  ];

  for (let i = 0; i < coisinhas.length; i++) {
    await setDoc(doc(db, "houses", houseId, "priorities_small", `seed_${i}`), coisinhas[i]);
  }

  // 4. Sample projects
  const projects = [
    { name: "Pintar sala de estar", status: "concluido", order: 1, category: "🎨 Pintura", budget: 200, spent: 150, completedAt: "2026-04-25", createdAt: new Date() },
    { name: "Instalar painéis solares", status: "em progresso", order: 2, category: "⚡ Eletricidade & Automação", budget: 5000, spent: 2000, createdAt: new Date() },
    { name: "Renovar casa de banho", status: "pendente", order: 3, category: "🏗️ Obras & Estrutura", budget: 3000, createdAt: new Date() },
    { name: "Arranjar telhado", status: "concluido", order: 4, category: "🔧 Reparações", completedAt: "2026-04-20", createdAt: new Date() },
  ];

  for (let i = 0; i < projects.length; i++) {
    await setDoc(doc(db, "houses", houseId, "priorities_big", `seed_${i}`), projects[i]);
  }

  // 5. Sample habits
  const habits = [
    { name: "Pílula", emoji: "💊", reminderTime: "22:00", streak: 35, lastChecked: "2026-05-01", assignee: "ambos", createdAt: new Date() },
    { name: "Beber água", emoji: "💧", streak: 20, lastChecked: "2026-05-01", assignee: "ambos", createdAt: new Date() },
    { name: "Exercício", emoji: "🏃", reminderTime: "07:00", streak: 10, lastChecked: "2026-04-30", createdAt: new Date() },
  ];

  for (let i = 0; i < habits.length; i++) {
    await setDoc(doc(db, "houses", houseId, "habits", `seed_${i}`), habits[i]);
  }

  // 6. Habit checks (last 7 days)
  const today = new Date();
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];
    for (let h = 0; h < habits.length; h++) {
      await setDoc(doc(db, "houses", houseId, "habit_checks", `seed_${d}_${h}`), {
        habitId: `seed_${h}`,
        date: dateStr,
        createdAt: new Date(),
      });
    }
  }

  // 7. Sample expenses
  const expenses = [
    { name: "Supermercado", amount: 85, category: "compras", paidBy: owner.toLowerCase(), date: "2026-05-01", createdAt: new Date() },
    { name: "Gasolina", amount: 60, category: "transporte", paidBy: owner.toLowerCase(), date: "2026-04-30", createdAt: new Date() },
    { name: "Restaurante", amount: 45, category: "restaurantes", paidBy: "ambos", date: "2026-04-29", createdAt: new Date() },
    { name: "Netflix", amount: 14, category: "lazer", paidBy: "ambos", date: "2026-04-28", createdAt: new Date() },
    { name: "Eletricidade", amount: 90, category: "casa", paidBy: "ambos", date: "2026-04-27", createdAt: new Date() },
  ];

  for (let i = 0; i < expenses.length; i++) {
    await setDoc(doc(db, "houses", houseId, "expenses", `seed_${i}`), expenses[i]);
  }

  // 8. Sample meal plans
  const mealDays = ["2026-05-01", "2026-05-02", "2026-05-03"];
  const meals = [
    { breakfast: "Panquecas", lunch: "Frango grelhado com arroz", dinner: "Sopa e tostas", snack: "Fruta" },
    { breakfast: "Granola com iogurte", lunch: "Massa carbonara", dinner: "Pizza caseira", snack: "Bolachas" },
    { breakfast: "Torradas com abacate", lunch: "Salada César", dinner: "Salmão com batatas", snack: "Smoothie" },
  ];

  for (let i = 0; i < mealDays.length; i++) {
    await setDoc(doc(db, "houses", houseId, "meal_plans", mealDays[i]), {
      date: mealDays[i],
      ...meals[i],
      createdAt: new Date(),
    });
  }

  return { success: true, message: "Test account seeded with maxed stats!" };
}
