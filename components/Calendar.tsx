"use client";

import { useState, useMemo } from "react";
import { useCollection, type SmallPriorityItem, type BigPriorityItem, type HabitItem, type HabitCheck } from "@/lib/hooks";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Portuguese holidays (fixed dates)
const HOLIDAYS_FIXED: Record<string, string> = {
  "01-01": "🎆 Ano Novo",
  "02-14": "💕 Dia dos Namorados",
  "03-19": "👨 Dia do Pai",
  "04-25": "🇵🇹 Dia da Liberdade",
  "05-01": "✊ Dia do Trabalhador",
  "05-04": "👩 Dia da Mãe",
  "06-01": "👶 Dia da Criança",
  "06-10": "🇵🇹 Dia de Portugal",
  "06-13": "🙏 Santo António",
  "08-15": "🙏 Assunção de Maria",
  "10-05": "🇵🇹 Implantação da República",
  "10-31": "🎃 Halloween",
  "11-01": "🙏 Dia de Todos os Santos",
  "12-01": "🇵🇹 Restauração da Independência",
  "12-08": "🙏 Imaculada Conceição",
  "12-24": "🎄 Véspera de Natal",
  "12-25": "🎄 Natal",
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
  label: string;
  type: "event" | "habit" | "deadline";
}

export default function Calendar() {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { items: habits } = useCollection<HabitItem>("habits", "createdAt");
  const { items: checks } = useCollection<HabitCheck>("habit_checks", "createdAt");
  const { items: coisinhas } = useCollection<SmallPriorityItem>("priorities_small", "order");
  const { items: projects } = useCollection<BigPriorityItem>("priorities_big", "order");

  const today = new Date().toISOString().split("T")[0];

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
      addDot(c.date, { color: "bg-green-400", label: `${habit?.emoji || "✓"} ${habit?.name || "Hábito"}`, type: "habit" });
    });

    // Completed coisinhas (pink) - use completedAt
    coisinhas.forEach((c) => {
      if (c.done && c.completedAt) {
        addDot(c.completedAt, { color: "bg-pink-400", label: `🪴 ${c.name}`, type: "deadline" });
      }
    });

    // Projects in progress (purple)
    projects.forEach((p) => {
      if (p.status === "concluido" && p.completedAt) {
        addDot(p.completedAt, { color: "bg-purple-400", label: `🏠 ${p.name}`, type: "deadline" });
      }
    });

    // Holidays (amber)
    const year = viewDate.getFullYear();
    Object.entries(HOLIDAYS_FIXED).forEach(([mmdd, label]) => {
      const dateStr = `${year}-${mmdd}`;
      addDot(dateStr, { color: "bg-amber-400", label, type: "event" });
    });
    const moving = getMovingHolidays(year);
    Object.entries(moving).forEach(([dateStr, label]) => {
      addDot(dateStr, { color: "bg-amber-400", label, type: "event" });
    });

    return map;
  }, [habits, checks, coisinhas, projects, viewDate]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-blue-100/40">
        <div className="flex items-center justify-between">
          <button onClick={() => changeMonth(-1)} className="text-blue-400 px-3 py-1 active:scale-90 text-lg">←</button>
          <h2 className="text-base font-bold text-blue-600 capitalize">
            {MONTHS_PT[viewDate.getMonth()]} {viewDate.getFullYear()}
          </h2>
          <button onClick={() => changeMonth(1)} className="text-blue-400 px-3 py-1 active:scale-90 text-lg">→</button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
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

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 ${
                  isSelected
                    ? "bg-blue-500 text-white shadow-md"
                    : isToday
                    ? "bg-blue-100 text-blue-700 font-bold"
                    : "hover:bg-blue-50 text-blue-800"
                }`}
              >
                <span className="text-xs">{day}</span>
                {dots.length > 0 && (
                  <div className="flex gap-0.5">
                    {dots.slice(0, 3).map((d, j) => (
                      <div key={j} className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : d.color}`} />
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
            {selectedDots.length === 0 && (
              <p className="text-xs text-blue-300 text-center py-4">Nada neste dia</p>
            )}
            {selectedDots.map((dot, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/70 rounded-xl p-3 border border-blue-100/30">
                <div className={`w-2 h-2 rounded-full ${dot.color}`} />
                <span className="text-sm text-blue-800">{dot.label}</span>
              </div>
            ))}
          </div>
        )}

        {!selectedDate && (
          <div className="text-center text-blue-300 py-6">
            <p className="text-xs">Tap num dia para ver detalhes</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-[10px]">Hábitos</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <span className="text-[10px]">Coisinhas</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-[10px]">Projetos</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
