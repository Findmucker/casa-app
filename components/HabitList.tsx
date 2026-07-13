"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import TabTip from "@/components/TabTip";
import { useCollection, type HabitItem, type HabitCheck } from "@/lib/hooks";
import { getToday, scheduleRepeatingNotification, cancelNotification, registerPushToken } from "@/lib/notifications";
import { awardPoints, updateStreak } from "@/lib/gamification";
import { useMemberNames, useHouseContext } from "@/lib/context";
import MiniAvatar from "./MiniAvatar";
import { useT } from "@/lib/i18n";
import { getLocalClock } from "@/lib/habit-reminder-time";

const HABIT_EMOJIS = ["💊", "💧", "🏃", "📖", "🧘", "🪴", "🧹", "💤", "🍎", "✍️"];

const WEEKDAYS = [
  { label: "D", value: 0 },
  { label: "S", value: 1 },
  { label: "T", value: 2 },
  { label: "Q", value: 3 },
  { label: "Q", value: 4 },
  { label: "S", value: 5 },
  { label: "S", value: 6 },
];

function isActiveToday(days?: number[]): boolean {
  if (!days || !Array.isArray(days) || days.length === 0) return true;
  return days.includes(new Date().getDay());
}

export default function HabitList() {
  const { t } = useT();
  const memberNames = useMemberNames();
  const { userId, userName } = useHouseContext();
  const { items: habits, loading, error, add, update, remove } = useCollection<HabitItem>("habits", "createdAt");
  const { items: checks, loading: checksLoading, add: addCheck } = useCollection<HabitCheck>("habit_checks", "createdAt");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🧘");
  const [newTime, setNewTime] = useState("");
  const [newAssignee, setNewAssignee] = useState("ambos");
  const [newDays, setNewDays] = useState<number[]>([]); // empty = todos os dias
  const [showAdd, setShowAdd] = useState(false);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [filter, setFilter] = useState("all");

  const today = getToday();

  // Check notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  const todayChecks = useMemo(() => {
    return new Set(checks.filter((c) => c.date === today).map((c) => c.habitId));
  }, [checks, today]);

  // Stable ref for todayChecks to avoid re-triggering notification effect
  const todayChecksRef = useRef(todayChecks);
  todayChecksRef.current = todayChecks;

  // Schedule notifications for habits with reminder times
  const timerIds = useRef<number[]>([]);
  useEffect(() => {
    // Clear previous timers
    timerIds.current.forEach((id) => cancelNotification(id));
    timerIds.current = [];

    if (!notificationsEnabled) return;
    habits.forEach((h) => {
      if (!h.reminderTime) return;
      if (!isActiveToday(h.days)) return;

      const id = scheduleRepeatingNotification(
        `${h.emoji} ${h.name}`,
        "Não te esqueças!",
        h.reminderTime,
        () => todayChecksRef.current.has(h.id)
      );
      if (id !== null) timerIds.current.push(id);
    });

    return () => {
      timerIds.current.forEach((id) => cancelNotification(id));
      timerIds.current = [];
    };
  }, [habits, notificationsEnabled]);

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
      const dateStr = getLocalClock(date).date;
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

    await addCheck({ habitId: habit.id, date: today });

    const newStreak = getStreak(habit.id) + 1;
    await update(habit.id, { streak: newStreak, lastChecked: today });
    await awardPoints(userName, 2, "habit_check");
    await updateStreak(userName, newStreak);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const habitId = await add({
      name,
      emoji: newEmoji,
      assignee: newAssignee,
      streak: 0,
      ...(newTime ? { reminderTime: newTime } : {}),
      ...(newDays.length > 0 ? { days: newDays } : {}),
    });
    if (!habitId) return;

    setNewName("");
    setNewTime("");
    setNewAssignee("ambos");
    setNewDays([]);
    setShowAdd(false);
  };

  const enableNotifications = async () => {
    const ok = await registerPushToken(userId);
    setNotificationsEnabled(ok);
  };

  const allChecked = habits.length > 0 && habits.every((h) => todayChecks.has(h.id));

  const filteredHabits = filter === "all"
    ? habits
    : habits.filter((h) => h.assignee === filter || h.assignee === "ambos" || (!h.assignee && filter === "ambos"));

  return (
    <div className="flex flex-col h-full">
      <TabTip tabId="habits" emoji="🧘" titleKey="tutorial.habits.title" tips={["tutorial.habits.tip1", "tutorial.habits.tip2", "tutorial.habits.tip3", "tutorial.habits.tip4"]} />
      {/* Header */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-purple-100/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-purple-600">
            {allChecked ? "✨ " + t("habits.allDone") : "🧘 " + t("habits.title")}
          </h2>
          <div className="flex gap-2">
            {!notificationsEnabled && (
              <button
                onClick={enableNotifications}
                aria-label={t("habits.enableReminders")}
                className="text-xs bg-purple-100 text-purple-500 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-all active:scale-95"
              >
                🔔 {t("habits.enableReminders")}
              </button>
            )}
            <button
              onClick={() => setShowAdd(!showAdd)}
              aria-label={showAdd ? "Fechar formulário" : "Adicionar hábito"}
              aria-expanded={showAdd}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white flex items-center justify-center text-lg active:scale-90 transition-all shadow-sm"
            >
              +
            </button>
          </div>
        </div>

        {/* Filter by person */}
        <div className="flex gap-1.5 mt-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              filter === "all" ? "bg-purple-200 text-purple-700" : "bg-purple-50 text-purple-400"
            }`}
          >
            {t("common.all")}
          </button>
          {memberNames.filter((m) => m.key !== "ambos").map((m) => (
            <button
              key={m.key}
              onClick={() => setFilter(m.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
                filter === m.key ? "bg-purple-200 text-purple-700" : "bg-purple-50 text-purple-400"
              }`}
            >
              <MiniAvatar name={m.key} size={18} showEquipBadge={false} /> {m.label}
            </button>
          ))}
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
                placeholder={t("habits.placeholder")}
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
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                    newAssignee === m.key ? "bg-purple-200 text-purple-700" : "bg-purple-50 text-purple-400"
                  }`}
                >
                  {m.key === "ambos" ? <span>👫</span> : <MiniAvatar name={m.key} size={18} showEquipBadge={false} />} {m.label}
                </button>
              ))}
            </div>
            {/* Days selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-500 font-medium">{t("common.weekdays")}</span>
                <button
                  onClick={() => setNewDays(newDays.length === 7 ? [] : [0,1,2,3,4,5,6])}
                  className="text-[10px] text-purple-400 hover:text-purple-600 transition-colors"
                >
                  {newDays.length === 0 || newDays.length === 7 ? t("common.allDays") + " ✓" : t("common.selectAll")}
                </button>
              </div>
              <div className="flex gap-1">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => {
                      setNewDays((prev) =>
                        prev.includes(d.value)
                          ? prev.filter((v) => v !== d.value)
                          : [...prev, d.value]
                      );
                    }}
                    className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all active:scale-90 ${
                      newDays.length === 0 || newDays.includes(d.value)
                        ? "bg-purple-200 text-purple-700"
                        : "bg-purple-50 text-purple-300"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-30 shadow-sm"
            >
              {t("habits.addButton")}
            </button>
          </div>
        )}
      </div>

      {/* Habits list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(loading || checksLoading) && (
          <div className="text-center text-purple-300 py-12 animate-pulse-soft">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-sm">{t("common.loading")}</p>
          </div>
        )}

        {error && (
          <div className="text-center text-red-400 py-12">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-sm font-medium">Não foi possível carregar ou guardar as rotinas</p>
            <p className="text-xs text-red-300 mt-1 px-4 break-all">{error}</p>
          </div>
        )}

        {!loading && !checksLoading && habits.length === 0 && (
          <div className="text-center text-purple-300 py-12">
            <div className="text-5xl mb-3 animate-float">✨</div>
            <p className="text-sm">{t("habits.empty")}</p>
            <p className="text-xs text-purple-200 mt-1">{t("habits.emptyHint")}</p>
          </div>
        )}

        {filteredHabits.map((habit) => {
          const checked = todayChecks.has(habit.id);
          const streak = getStreak(habit.id);
          const isCelebrating = celebrating === habit.id;
          const activeToday = isActiveToday(habit.days);

          return (
            <div
              key={habit.id}
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border transition-all ${
                !activeToday
                  ? "border-gray-200/40 opacity-40"
                  : checked
                  ? "border-green-200/60 bg-green-50/30"
                  : "border-purple-100/30 shadow-purple-100/30"
              } ${isCelebrating ? "animate-celebrate" : ""}`}
            >
              <div className="flex items-center gap-3">
                {/* Check button */}
                <button
                  onClick={() => handleCheck(habit)}
                  disabled={checked || !activeToday}
                  aria-label={checked ? `${habit.name} já feito` : `Marcar ${habit.name} como feito`}
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
                        🔥 {streak} {streak === 1 ? t("habits.streak") : t("habits.streakPlural")}
                      </span>
                    )}
                    {habit.reminderTime && (
                      <span className="text-[11px] text-purple-400">⏰ {habit.reminderTime}</span>
                    )}
                    {habit.days && Array.isArray(habit.days) && habit.days.length > 0 && habit.days.length < 7 && (
                      <span className="text-[10px] text-purple-300 flex gap-0.5">
                        {WEEKDAYS.map((d) => (
                          <span key={d.value} className={habit.days!.includes(d.value) ? "text-purple-500 font-bold" : "text-purple-200"}>
                            {d.label}
                          </span>
                        ))}
                      </span>
                    )}
                    {habit.assignee && habit.assignee !== "ambos" && (
                      <span className="text-[11px] text-purple-400 flex items-center gap-1">
                        <MiniAvatar name={habit.assignee} size={14} />
                        {memberNames.find((m) => m.key === habit.assignee)?.label}
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
                  aria-label={`Apagar hábito ${habit.name}`}
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
