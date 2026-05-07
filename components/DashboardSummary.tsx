"use client";

import { useMemo } from "react";
import { useSharedCollections } from "@/lib/hooks";
import { getToday } from "@/lib/notifications";
import { useT } from "@/lib/i18n";

interface DashboardSummaryProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardSummary({ onNavigate }: DashboardSummaryProps) {
  const { t } = useT();
  const { shopping, coisinhas, projects, habits, checks, expenses } = useSharedCollections();

  const today = getToday();
  const currentMonth = today.substring(0, 7);

  const stats = useMemo(() => {
    const shoppingPending = shopping.filter((s) => !s.done).length;
    const shoppingDone = shopping.filter((s) => s.done).length;
    const coisinhasPending = coisinhas.filter((c) => !c.done).length;
    const coisinhasDone = coisinhas.filter((c) => c.done).length;
    const projectsInProgress = projects.filter((p) => p.status === "em progresso").length;
    const projectsDone = projects.filter((p) => p.status === "concluido").length;
    const todayChecks = checks.filter((c) => c.date === today).length;
    const totalHabits = habits.length;
    const monthExpenses = expenses.filter((e) => e.date?.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0);

    let maxStreak = 0;
    habits.forEach((h) => {
      if (h.streak > maxStreak) maxStreak = h.streak;
    });

    // Weekly progress
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const weeklyDone = [
      ...shopping.filter((s) => s.done && s.completedAt && s.completedAt >= weekStartStr),
      ...coisinhas.filter((c) => c.done && c.completedAt && c.completedAt >= weekStartStr),
    ].length;

    const weeklyTotal = Math.max(weeklyDone + shoppingPending + coisinhasPending, 1);
    const weeklyPct = Math.min(100, Math.round((weeklyDone / weeklyTotal) * 100));

    // Urgent items
    const urgentShopping = shopping.filter((s) => !s.done && s.urgent).length;

    return {
      shoppingPending, shoppingDone, coisinhasPending, coisinhasDone,
      projectsInProgress, projectsDone, todayChecks, totalHabits,
      monthExpenses, maxStreak, weeklyPct, weeklyDone,
      urgentShopping,
    };
  }, [shopping, coisinhas, projects, habits, checks, expenses, today, currentMonth]);

  const motivation = useMemo(() => {
    if (stats.weeklyPct >= 80) return { text: t("dashboard.motivation.amazing"), emoji: "🏆" };
    if (stats.weeklyPct >= 60) return { text: t("dashboard.motivation.good"), emoji: "💪" };
    if (stats.weeklyPct >= 30) return { text: t("dashboard.motivation.goForIt"), emoji: "🚀" };
    return { text: t("dashboard.motivation.oneStep"), emoji: "🌱" };
  }, [stats.weeklyPct, t]);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return t("dashboard.thisMorning");
    if (hour >= 12 && hour < 19) return t("dashboard.thisAfternoon");
    return t("dashboard.thisEvening");
  }, [t]);

  const habitsComplete = stats.totalHabits > 0 && stats.todayChecks >= stats.totalHabits;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hero section */}
      <div className="relative px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-purple-400 font-medium">{t("dashboard.whatToDo")} {timeGreeting}</p>
            <h2 className="text-lg font-bold text-rose-600 mt-0.5 flex items-center gap-2">
              {motivation.emoji} {motivation.text}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-rose-500">{stats.weeklyPct}%</p>
            <p className="text-[9px] text-purple-400">{t("dashboard.weekly")}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-3 bg-pink-100/80 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${stats.weeklyPct}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
        </div>
        <p className="text-[10px] text-purple-400 mt-1">{stats.weeklyDone} {t("dashboard.weeklyDone")}</p>
      </div>

      {/* Urgent alerts */}
      {stats.urgentShopping > 0 && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/50">
          <p className="text-xs font-bold text-red-500 flex items-center gap-1">
            🚨 {t("dashboard.urgent")}
          </p>
          <div className="flex gap-3 mt-1">
            <button onClick={() => onNavigate("shopping")} className="text-[11px] text-red-600 font-medium hover:underline">
              {stats.urgentShopping} {stats.urgentShopping > 1 ? t("dashboard.shoppingItemsPlural") : t("dashboard.shoppingItems")}
            </button>
          </div>
        </div>
      )}

      {/* Habits quick status */}
      <div className="mx-4 mb-3">
        <button
          onClick={() => onNavigate("habits")}
          className={`w-full p-3 rounded-xl border transition-all active:scale-[0.98] ${
            habitsComplete
              ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200/50"
              : "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{habitsComplete ? "✅" : "🧘"}</span>
              <div className="text-left">
                <p className={`text-xs font-bold ${habitsComplete ? "text-emerald-600" : "text-purple-600"}`}>
                  {habitsComplete ? t("dashboard.habitsComplete") : t("dashboard.habitsToday")}
                </p>
                <p className="text-[10px] text-gray-500">
                  {stats.todayChecks}/{stats.totalHabits} {t("dashboard.habitsDone")}
                </p>
              </div>
            </div>
            {stats.maxStreak > 0 && (
              <div className="text-right">
                <p className="text-sm font-bold text-orange-500">🔥 {stats.maxStreak}</p>
                <p className="text-[9px] text-gray-400">{t("dashboard.streak")}</p>
              </div>
            )}
          </div>
          {/* Mini habit progress */}
          {stats.totalHabits > 0 && (
            <div className="flex gap-1 mt-2">
              {Array.from({ length: stats.totalHabits }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    i < stats.todayChecks ? "bg-emerald-400" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}
        </button>
      </div>

      {/* Main cards grid */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-2">
        <button
          onClick={() => onNavigate("shopping")}
          className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl p-3.5 border border-pink-200/40 text-left transition-all active:scale-[0.96] hover:shadow-md animate-fade-in-up"
          style={{ animationDelay: "0ms" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🛒</span>
            {stats.shoppingPending > 5 && <span className="text-[9px] bg-pink-200 text-pink-600 px-1.5 py-0.5 rounded-full font-bold">{t("dashboard.tooMany")}</span>}
          </div>
          <p className="text-xl font-bold text-gray-800 mt-1.5">{stats.shoppingPending}</p>
          <p className="text-[11px] text-gray-500">{t("dashboard.shoppingPending")}</p>
          {stats.shoppingDone > 0 && (
            <div className="mt-2 h-1 bg-pink-100 rounded-full overflow-hidden">
              <div className="h-full bg-pink-400 rounded-full" style={{ width: `${(stats.shoppingDone / (stats.shoppingDone + stats.shoppingPending)) * 100}%` }} />
            </div>
          )}
        </button>

        <button
          onClick={() => onNavigate("small")}
          className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl p-3.5 border border-purple-200/40 text-left transition-all active:scale-[0.96] hover:shadow-md animate-fade-in-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🪴</span>
            {stats.coisinhasPending > 5 && <span className="text-[9px] bg-purple-200 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">{t("dashboard.tooMany")}</span>}
          </div>
          <p className="text-xl font-bold text-gray-800 mt-1.5">{stats.coisinhasPending}</p>
          <p className="text-[11px] text-gray-500">{t("dashboard.coisinhasPending")}</p>
          {stats.coisinhasDone > 0 && (
            <div className="mt-2 h-1 bg-purple-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(stats.coisinhasDone / (stats.coisinhasDone + stats.coisinhasPending)) * 100}%` }} />
            </div>
          )}
        </button>

        <button
          onClick={() => onNavigate("big")}
          className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-3.5 border border-blue-200/40 text-left transition-all active:scale-[0.96] hover:shadow-md animate-fade-in-up"
          style={{ animationDelay: "120ms" }}
        >
          <span className="text-2xl">🏠</span>
          <p className="text-xl font-bold text-gray-800 mt-1.5">{stats.projectsInProgress}</p>
          <p className="text-[11px] text-gray-500">{t("dashboard.projectsInProgress")}</p>
          {stats.projectsDone > 0 && (
            <p className="text-[9px] text-emerald-500 mt-1 font-medium">✓ {stats.projectsDone} {t("dashboard.projectsDone")}</p>
          )}
        </button>

        <button
          onClick={() => onNavigate("expenses")}
          className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-3.5 border border-emerald-200/40 text-left transition-all active:scale-[0.96] hover:shadow-md animate-fade-in-up"
          style={{ animationDelay: "180ms" }}
        >
          <span className="text-2xl">💰</span>
          <p className="text-xl font-bold text-gray-800 mt-1.5">{stats.monthExpenses.toFixed(0)}€</p>
          <p className="text-[11px] text-gray-500">{t("dashboard.monthExpenses")}</p>
        </button>
      </div>

    </div>
  );
}
