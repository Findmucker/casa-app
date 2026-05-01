"use client";

import { useMemo } from "react";
import { useCollection, type ShoppingItem, type SmallPriorityItem, type BigPriorityItem, type HabitItem, type HabitCheck, type ExpenseItem } from "@/lib/hooks";
import { getToday } from "@/lib/notifications";

interface DashboardSummaryProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardSummary({ onNavigate }: DashboardSummaryProps) {
  const { items: shopping } = useCollection<ShoppingItem>("shopping", "createdAt");
  const { items: coisinhas } = useCollection<SmallPriorityItem>("priorities_small", "order");
  const { items: projects } = useCollection<BigPriorityItem>("priorities_big", "order");
  const { items: habits } = useCollection<HabitItem>("habits", "createdAt");
  const { items: checks } = useCollection<HabitCheck>("habit_checks", "createdAt");
  const { items: expenses } = useCollection<ExpenseItem>("expenses", "createdAt");

  const today = getToday();
  const currentMonth = today.substring(0, 7);

  const stats = useMemo(() => {
    const shoppingPending = shopping.filter((s) => !s.done).length;
    const coisinhasPending = coisinhas.filter((c) => !c.done).length;
    const projectsInProgress = projects.filter((p) => p.status === "em progresso").length;
    const todayChecks = checks.filter((c) => c.date === today).length;
    const totalHabits = habits.length;
    const monthExpenses = expenses.filter((e) => e.date?.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0);

    // Calculate max streak across all habits
    let maxStreak = 0;
    habits.forEach((h) => {
      if (h.streak > maxStreak) maxStreak = h.streak;
    });

    // Weekly progress: items completed this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const weeklyDone = [
      ...shopping.filter((s) => s.done && s.completedAt && s.completedAt >= weekStartStr),
      ...coisinhas.filter((c) => c.done && c.completedAt && c.completedAt >= weekStartStr),
    ].length;

    const weeklyTotal = shopping.length + coisinhas.length;
    const weeklyPct = weeklyTotal > 0 ? Math.min(100, Math.round((weeklyDone / Math.max(weeklyDone + shoppingPending + coisinhasPending, 1)) * 100)) : 0;

    return { shoppingPending, coisinhasPending, projectsInProgress, todayChecks, totalHabits, monthExpenses, maxStreak, weeklyPct };
  }, [shopping, coisinhas, projects, habits, checks, expenses, today, currentMonth]);

  const cards = [
    { emoji: "🛒", label: `${stats.shoppingPending} comprinhas`, sub: "por fazer", tab: "shopping", color: "from-pink-100 to-rose-100 border-pink-200/40" },
    { emoji: "🪴", label: `${stats.coisinhasPending} coisinhas`, sub: "pendentes", tab: "small", color: "from-pink-100 to-purple-100 border-purple-200/40" },
    { emoji: "🏠", label: `${stats.projectsInProgress} projetinhos`, sub: "em progresso", tab: "big", color: "from-purple-100 to-blue-100 border-blue-200/40" },
    { emoji: "💊", label: `${stats.todayChecks}/${stats.totalHabits} hábitos`, sub: "hoje", tab: "habits", color: "from-purple-100 to-indigo-100 border-purple-200/40" },
    { emoji: "🔥", label: `${stats.maxStreak} dias`, sub: "melhor streak", tab: "habits", color: "from-orange-100 to-red-100 border-orange-200/40" },
    { emoji: "💰", label: `${stats.monthExpenses.toFixed(0)}€`, sub: "este mês", tab: "expenses", color: "from-emerald-100 to-teal-100 border-emerald-200/40" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header with weekly progress */}
      <div className="p-4 bg-white/60 backdrop-blur-sm border-b border-pink-100/40">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-rose-500">✨ Resumo</h2>
          <span className="text-xs font-bold text-rose-400">{stats.weeklyPct}%</span>
        </div>
        <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-700"
            style={{ width: `${stats.weeklyPct}%` }}
          />
        </div>
        <p className="text-[10px] text-pink-400 mt-1">Progresso semanal</p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={() => onNavigate(card.tab)}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 border text-left transition-all active:scale-[0.96] hover:shadow-md animate-fade-in-up`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="text-2xl">{card.emoji}</span>
            <p className="text-sm font-bold text-gray-800 mt-2">{card.label}</p>
            <p className="text-[11px] text-gray-500">{card.sub}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
