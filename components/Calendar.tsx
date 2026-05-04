"use client";

import { useState, useMemo, useEffect } from "react";
import TabTip from "@/components/TabTip";
import MiniAvatar from "@/components/MiniAvatar";
import { useSharedCollections, useCollection } from "@/lib/hooks";
import { useHouseContext } from "@/lib/context";
import { useFriends } from "@/lib/friends";
import { useT } from "@/lib/i18n";
import { getWeatherInfo } from "@/lib/weather";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CasaEvent } from "./EventList";


// Portuguese holidays (fixed dates) — emoji reflects the holiday itself
const HOLIDAYS_FIXED: Record<string, string> = {
  "01-01": "🎆 Ano Novo",
  "02-14": "💕 Dia dos Namorados",
  "03-19": "👨 Dia do Pai",
  "04-25": "🔴 Dia da Liberdade",
  "05-01": "✊ Dia do Trabalhador",
  "05-04": "👩 Dia da Mãe",
  "06-01": "👶 Dia da Criança",
  "06-10": "🇵🇹 Dia de Portugal",
  "06-13": "🙏 Santo António",
  "08-15": "🙏 Assunção de Maria",
  "10-05": "📜 Implantação da República",
  "10-31": "🎃 Halloween",
  "11-01": "🕯️ Dia de Todos os Santos",
  "12-01": "🛡️ Restauração da Independência",
  "12-08": "🙏 Imaculada Conceição",
  "12-24": "🎄 Véspera de Natal",
  "12-25": "🎁 Natal",
  "12-31": "🎇 Véspera de Ano Novo",
};

// Easter-based holidays (calculated per year)
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getMovingHolidays(year: number): Record<string, string> {
  const easter = getEasterDate(year);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const offset = (days: number) => {
    const d = new Date(easter);
    d.setDate(d.getDate() + days);
    return fmt(d);
  };
  return {
    [offset(-47)]: "🎭 Carnaval",
    [offset(-2)]: "✝️ Sexta-feira Santa",
    [offset(0)]: "🐣 Páscoa",
    [offset(60)]: "🙏 Corpo de Deus",
  };
}

interface CalendarDot {
  color: string;
  emoji: string;
  label: string;
  type: "event" | "habit" | "deadline" | "weather" | "birthday";
  memberName?: string; // for birthday dots — renders MiniAvatar
}

interface DayWeather {
  tempMax: number;
  tempMin: number;
  weathercode: number;
  precipProb: number;
}

// Cache weather data in memory
let weatherCache: { data: Record<string, DayWeather>; fetchedAt: number } | null = null;

async function fetchWeather7Days(): Promise<Record<string, DayWeather>> {
  if (weatherCache && Date.now() - weatherCache.fetchedAt < 30 * 60 * 1000) {
    return weatherCache.data;
  }
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=39.36&longitude=-9.16&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=Europe/Lisbon&forecast_days=7"
    );
    const json = await res.json();
    const result: Record<string, DayWeather> = {};
    for (let i = 0; i < json.daily.time.length; i++) {
      result[json.daily.time[i]] = {
        tempMax: Math.round(json.daily.temperature_2m_max[i]),
        tempMin: Math.round(json.daily.temperature_2m_min[i]),
        weathercode: json.daily.weather_code[i],
        precipProb: json.daily.precipitation_probability_max[i],
      };
    }
    weatherCache = { data: result, fetchedAt: Date.now() };
    return result;
  } catch {
    return {};
  }
}

export default function Calendar() {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<Record<string, DayWeather>>({});
  const [birthdays, setBirthdays] = useState<{ name: string; date: string; houseName?: string }[]>([]);
  const [friendBirthdays, setFriendBirthdays] = useState<{ name: string; date: string; houseName?: string }[]>([]);

  const { habits, checks, coisinhas, projects } = useSharedCollections();
  const { items: events } = useCollection<CasaEvent>("events", "createdAt");
  const { members, houseId } = useHouseContext();
  const { friends } = useFriends(houseId);
  const { t, tArray } = useT();
  const weekdays = tArray("calendar.weekdays");
  const months = tArray("calendar.months");

  const today = new Date().toISOString().split("T")[0];

  // Fetch weather on mount
  useEffect(() => {
    fetchWeather7Days().then(setWeatherData);
  }, []);

  // Fetch member birthdays (own house)
  useEffect(() => {
    if (members.length === 0) return;
    const load = async () => {
      const results: { name: string; date: string; houseName?: string }[] = [];
      for (const m of members) {
        try {
          const snap = await getDoc(doc(db, "users", m.uid));
          if (snap.exists() && snap.data().birthDate) {
            results.push({ name: m.name, date: snap.data().birthDate });
          }
        } catch { /* ignore */ }
      }
      setBirthdays(results);
    };
    load();
  }, [members]);

  // Fetch friend house members' birthdays
  useEffect(() => {
    if (friends.length === 0) return;
    const load = async () => {
      const results: { name: string; date: string; houseName?: string }[] = [];
      for (const friend of friends) {
        try {
          const houseSnap = await getDoc(doc(db, "houses", friend.houseId));
          if (!houseSnap.exists()) continue;
          const houseMembers = houseSnap.data().members || [];
          for (const m of houseMembers) {
            if (!m.uid) continue;
            try {
              const userSnap = await getDoc(doc(db, "users", m.uid));
              if (userSnap.exists() && userSnap.data().birthDate) {
                results.push({ name: m.name, date: userSnap.data().birthDate, houseName: friend.houseName });
              }
            } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
      }
      setFriendBirthdays(results);
    };
    load();
  }, [friends]);

  // Build dots map: date → dots[]
  const dotsMap = useMemo(() => {
    const map: Record<string, CalendarDot[]> = {};

    const addDot = (date: string, dot: CalendarDot) => {
      if (!map[date]) map[date] = [];
      map[date].push(dot);
    };

    // Habit checks (green)
    checks.forEach((c) => {
      const habit = habits.find((h) => h.id === c.habitId);
      addDot(c.date, { color: "bg-green-400", emoji: "🧘", label: `${habit?.emoji || "✓"} ${habit?.name || "Hábito"}`, type: "habit" });
    });

    // Completed coisinhas (pink) - use completedAt
    coisinhas.forEach((c) => {
      if (c.done && c.completedAt) {
        addDot(c.completedAt, { color: "bg-pink-400", emoji: "🪴", label: `🪴 ${c.name}`, type: "deadline" });
      }
    });

    // Projects in progress (purple)
    projects.forEach((p) => {
      if (p.status === "concluido" && p.completedAt) {
        addDot(p.completedAt, { color: "bg-purple-400", emoji: "🏠", label: `🏠 ${p.name}`, type: "deadline" });
      }
    });

    // Events (red/coral)
    events.forEach((e) => {
      if (e.date) {
        addDot(e.date, { color: "bg-red-400", emoji: "🎉", label: `🎉 ${e.title}`, type: "event" });
      }
    });

    // Holidays (amber) — use each holiday's own emoji
    const year = viewDate.getFullYear();
    Object.entries(HOLIDAYS_FIXED).forEach(([mmdd, label]) => {
      const dateStr = `${year}-${mmdd}`;
      const emoji = label.match(/^\p{Emoji_Presentation}/u)?.[0] || "📅";
      addDot(dateStr, { color: "bg-amber-400", emoji, label, type: "event" });
    });
    const moving = getMovingHolidays(year);
    Object.entries(moving).forEach(([dateStr, label]) => {
      const emoji = label.match(/^\p{Emoji_Presentation}/u)?.[0] || "📅";
      addDot(dateStr, { color: "bg-amber-400", emoji, label, type: "event" });
    });

    // Birthdays (show on this year's date matching month-day)
    birthdays.forEach((b) => {
      // birthDate format could be "YYYY-MM-DD" or "MM-DD"
      const parts = b.date.split("-");
      const mmdd = parts.length === 3 ? `${parts[1]}-${parts[2]}` : b.date;
      const dateStr = `${year}-${mmdd}`;
      addDot(dateStr, { color: "bg-cyan-400", emoji: "🎂", label: `🎂 ${b.name}`, type: "birthday", memberName: b.name });
    });

    // Friend birthdays
    friendBirthdays.forEach((b) => {
      const parts = b.date.split("-");
      const mmdd = parts.length === 3 ? `${parts[1]}-${parts[2]}` : b.date;
      const dateStr = `${year}-${mmdd}`;
      addDot(dateStr, { color: "bg-cyan-300", emoji: "🎂", label: `🎂 ${b.name} (${b.houseName})`, type: "birthday", memberName: b.name });
    });

    return map;
  }, [habits, checks, coisinhas, projects, events, viewDate, birthdays, friendBirthdays]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    // Monday = 0
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [viewDate]);

  const getDateStr = (day: number) => {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-${String(day).padStart(2, "0")}`;
  };

  const changeMonth = (delta: number) => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
    setSelectedDate(null);
  };

  const selectedDots = selectedDate ? dotsMap[selectedDate] || [] : [];
  const selectedWeather = selectedDate ? weatherData[selectedDate] : null;

  return (
    <div className="flex flex-col h-full">
      <TabTip tabId="calendar" emoji="📅" titleKey="tutorial.calendar.title" tips={["tutorial.calendar.tip1", "tutorial.calendar.tip2", "tutorial.calendar.tip3", "tutorial.calendar.tip4"]} />
      {/* Header */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-blue-100/40">
        <div className="flex items-center justify-between">
          <button onClick={() => changeMonth(-1)} aria-label="Mês anterior" className="text-blue-400 px-3 py-1 active:scale-90 text-lg">&larr;</button>
          <h2 className="text-base font-bold text-blue-600 capitalize">
            {months[viewDate.getMonth()]} {viewDate.getFullYear()}
          </h2>
          <button onClick={() => changeMonth(1)} aria-label="Mês seguinte" className="text-blue-400 px-3 py-1 active:scale-90 text-lg">&rarr;</button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-blue-400">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} />;
            const dateStr = getDateStr(day);
            const dots = dotsMap[dateStr] || [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dayWeather = weatherData[dateStr];

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 relative ${
                  isSelected
                    ? "bg-blue-500 text-white shadow-md"
                    : isToday
                    ? "bg-blue-100 text-blue-700 font-bold"
                    : "hover:bg-blue-50 text-blue-800"
                }`}
              >
                <span className="text-xs">{day}</span>
                {dayWeather && (
                  <span className="text-[8px] leading-none">{getWeatherInfo(dayWeather.weathercode).emoji}</span>
                )}
                {dots.length > 0 && (
                  <div className="flex gap-0.5 items-center">
                    {dots.slice(0, 3).map((d, j) => (
                      d.memberName
                        ? <MiniAvatar key={j} name={d.memberName} size={12} showEquipBadge={false} />
                        : <span key={j} className="text-[7px] leading-none">{d.emoji}</span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day details */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {selectedDate && (
          <div className="space-y-2 animate-fade-in-up">
            <p className="text-xs font-semibold text-blue-500 mb-2">
              {new Date(selectedDate + "T12:00").toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
            </p>

            {/* Weather card for selected day */}
            {selectedWeather && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-3 border border-sky-200/40">
                <span className="text-2xl">{getWeatherInfo(selectedWeather.weathercode).emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-sky-700">{getWeatherInfo(selectedWeather.weathercode).label}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-sky-600">🌡️ {selectedWeather.tempMin}° — {selectedWeather.tempMax}°</span>
                    {selectedWeather.precipProb > 0 && (
                      <span className="text-xs text-sky-500">💧 {selectedWeather.precipProb}%</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedDots.length === 0 && !selectedWeather && (
              <p className="text-xs text-blue-300 text-center py-4">{t("calendar.nothingToday")}</p>
            )}
            {selectedDots.map((dot, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/70 rounded-xl p-3 border border-blue-100/30">
                {dot.memberName ? (
                  <MiniAvatar name={dot.memberName} size={24} showEquipBadge={false} />
                ) : null}
                <span className="text-sm text-blue-800 flex-1">{dot.label}</span>
                <span className={`w-2 h-2 rounded-full ${dot.color}`} />
              </div>
            ))}
          </div>
        )}

        {!selectedDate && (
          <div className="text-center text-blue-300 py-6">
            <p className="text-xs">{t("calendar.tapDay")}</p>
            <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">🧘</span>
                <span className="text-[10px]">{t("calendar.habits")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">🪴</span>
                <span className="text-[10px]">{t("calendar.tasks")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">🏠</span>
                <span className="text-[10px]">{t("calendar.projects")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">🎉</span>
                <span className="text-[10px]">{t("calendar.events")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">☀️</span>
                <span className="text-[10px]">{t("calendar.weather")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">📅</span>
                <span className="text-[10px]">{t("calendar.holidays")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">🎂</span>
                <span className="text-[10px]">{t("calendar.birthdays")}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
