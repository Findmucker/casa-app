"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useCollection, type HabitItem, type HabitCheck } from "@/lib/hooks";
import { getToday, scheduleLocalNotification, requestNotificationPermission } from "@/lib/notifications";
import { awardPoints, updateStreak } from "@/lib/gamification";
import { useMemberNames } from "@/lib/context";

const DEFAULT_HABITS = [
  { name: "Pílula", emoji: "💊", reminderTime: "22:00" },
];

const HABIT_EMOJIS = ["💊", "💧", "🏃", "📖", "🧘", "🪴", "🧹", "💤", "🍎", "✍️"];

export default function HabitList() {
  const memberNames = useMemberNames();
  const { items: habits, loading, add, update, remove } = useCollection<HabitItem>("habits", "createdAt");
  const { items: checks, add: addCheck } = useCollection<HabitCheck>("habit_checks", "createdAt");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💊");
  const [newTime, setNewTime] = useState("");
  const [newAssignee, setNewAssignee] = useState("ambos");
  const [showAdd, setShowAdd] = useState(false);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const today = getToday();

  // Check notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  // Schedule notifications for habits with reminder times
  useEffect(() => {
    if (!notificationsEnabled) return;
    habits.forEach((h) => {
      if (h.reminderTime) {
        scheduleLocalNotification(
          `${h.emoji} ${h.name}`,
          "Não te esqueças!",
          h.reminderTime
        );
      }
    });
  }, [habits, notificationsEnabled]);

  const todayChecks = useMemo(() => {
    return new Set(checks.filter((c) => c.date === today).map((c) => c.habitId));
  }, [checks, today]);

  const getStreak = useCallback((habitId: string) => {
    const habitChecks = checks
      .filter((c) => c.habitId === habitId)
      .map((c) => c.date)
      .sort()
      .reverse();

    let streak = 0;
    const date = new Date();

    // If not checked today, start from yesterday
    if (!habitChecks.includes(today)) {
      date.setDate(date.getDate() - 1);
    }

    while (true) {
      const dateStr = date.toISOString().split("T")[0];
      if (habitChecks.includes(dateStr)) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [checks, today]);

  const handleCheck = async (habit: HabitItem) => {
    if (todayChecks.has(habit.id)) return; // Already checked

    setCelebrating(habit.id);
    setTimeout(() => setCelebrating(null), 800);

    await addCheck({ habitId: habit.id, date: today } as Omit<HabitCheck, "id">);

    const newStreak = getStreak(habit.id) + 1;
    await update(habit.id, { streak: newStreak, lastChecked: today });
    await awardPoints("shared", 2, "habit_check");
    await updateStreak("shared", newStreak);
  };

  const handleUncheck = async (habit: HabitItem) => {
    const check = checks.find((c) => c.habitId === habit.id && c.date === today);
    if (!check) return;
    // We can't easily delete from useCollection by query, so we'll just skip uncheck for now
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await add({
      name,
      emoji: newEmoji,
      reminderTime: newTime || undefined,
      assignee: newAssignee,
      streak: 0,
    } as Omit<HabitItem, "id">);
    setNewName("");
    setNewTime("");
    setNewAssignee("ambos");
    setShowAdd(false);
  };

  const enableNotifications = async () => {
    const ok = await requestNotificationPermission("shared");
    setNotificationsEnabled(ok);
  };

  const allChecked = habits.length > 0 && habits.every((h) => todayChecks.has(h.id));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-purple-100/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-purple-600">
            {allChecked ? "✨ Tudo feito hoje!" : "💊 Rotinazinhas"}
          </h2>
          <div className="flex gap-2">
            {!notificationsEnabled && (
              <button
                onClick={enableNotifications}
                className="text-xs bg-purple-100 text-purple-500 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-all active:scale-95"
              >
                🔔 Ativar lembretes
              </button>
            )}
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white flex items-center justify-center text-lg active:scale-90 transition-all shadow-sm"
            >
              +
            </button>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="mt-3 space-y-2 animate-expand">
            <div className="flex gap-2">
              <div className="flex gap-1 flex-wrap">
                {HABIT_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all active:scale-90 ${
                      newEmoji === e ? "bg-purple-200 scale-110" : "bg-purple-50 hover:bg-purple-100"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Nome do hábito..."
                className="flex-1 rounded-2xl border border-purple-200/60 bg-white/80 px-4 py-2.5 text-sm text-purple-800 placeholder-purple-300 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100/50"
                autoFocus
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-2xl border border-purple-200/60 bg-white/80 px-3 py-2.5 text-sm text-purple-800 focus:outline-none focus:border-purple-300"
              />
            </div>
            <div className="flex gap-2">
              {memberNames.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setNewAssignee(m.key)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                    newAssignee === m.key ? "bg-purple-200 text-purple-700" : "bg-purple-50 text-purple-400"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-30 shadow-sm"
            >
              Adicionar hábito
            </button>
          </div>
        )}
      </div>

      {/* Habits list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="text-center text-purple-300 py-12 animate-pulse-soft">
            <div className="text-3xl mb-2">💊</div>
            <p className="text-sm">A carregar...</p>
          </div>
        )}

        {!loading && habits.length === 0 && (
          <div className="text-center text-purple-300 py-12">
            <div className="text-5xl mb-3 animate-float">💊</div>
            <p className="text-sm">Nenhuma rotina ainda!</p>
            <p className="text-xs text-purple-200 mt-1">Adiciona o teu primeiro hábito</p>
            <button
              onClick={async () => {
                for (const h of DEFAULT_HABITS) {
                  await add({ ...h, streak: 0 } as Omit<HabitItem, "id">);
                }
              }}
              className="mt-4 text-xs bg-purple-100 text-purple-500 px-4 py-2 rounded-full hover:bg-purple-200 transition-all"
            >
              ✨ Começar com pílula
            </button>
          </div>
        )}

        {habits.map((habit) => {
          const checked = todayChecks.has(habit.id);
          const streak = getStreak(habit.id);
          const isCelebrating = celebrating === habit.id;

          return (
            <div
              key={habit.id}
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border transition-all ${
                checked
                  ? "border-green-200/60 bg-green-50/30"
                  : "border-purple-100/30 shadow-purple-100/30"
              } ${isCelebrating ? "animate-celebrate" : ""}`}
            >
              <div className="flex items-center gap-3">
                {/* Check button */}
                <button
                  onClick={() => handleCheck(habit)}
                  disabled={checked}
                  className={`h-12 w-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl transition-all active:scale-90 ${
                    checked
                      ? "bg-gradient-to-r from-green-300 to-emerald-300 text-white shadow-sm"
                      : "bg-purple-50 border-2 border-purple-200 hover:bg-purple-100 hover:border-purple-300"
                  }`}
                >
                  {checked ? "✓" : habit.emoji}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${checked ? "text-green-600 line-through" : "text-purple-800"}`}>
                    {habit.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {streak > 0 && (
                      <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5">
                        🔥 {streak} {streak === 1 ? "dia" : "dias"}
                      </span>
                    )}
                    {habit.reminderTime && (
                      <span className="text-[11px] text-purple-400">⏰ {habit.reminderTime}</span>
                    )}
                    {habit.assignee && habit.assignee !== "ambos" && (
                      <span className="text-[11px] text-purple-400">
                        {memberNames.find((m) => m.key === habit.assignee)?.emoji} {memberNames.find((m) => m.key === habit.assignee)?.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Streak visual */}
                {streak >= 5 && (
                  <div className="text-lg animate-pulse-heart">🔥</div>
                )}

                {/* Delete */}
                <button
                  onClick={() => remove(habit.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-purple-300 hover:text-red-400 transition-all active:scale-90 text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Streak bar */}
              {streak > 0 && (
                <div className="mt-2 ml-15">
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(streak, 30) }).map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-orange-300 to-red-400"
                        style={{ opacity: 0.4 + (i / 30) * 0.6 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
