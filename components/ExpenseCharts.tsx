"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n";

interface ChartData {
  label: string;
  value: number;
  color: string;
  emoji?: string;
}

interface MonthlyData {
  month: string;
  expenses: number;
  income: number;
}

// --- DONUT CHART ---
function DonutChart({ data, total, centerLabel }: { data: ChartData[]; total: number; centerLabel?: string }) {
  const radius = 40;
  const cx = 50;
  const cy = 50;
  const strokeWidth = 16;

  let cumulative = 0;
  const segments = data.map((d) => {
    const pct = total > 0 ? d.value / total : 0;
    const startAngle = cumulative * 360;
    const endAngle = (cumulative + pct) * 360;
    cumulative = cumulative + pct; // eslint-disable-line react-hooks/immutability
    return { ...d, startAngle, endAngle, pct };
  });

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-full h-full max-w-[160px] mx-auto">
        {segments.map((seg, i) => {
          if (seg.pct === 0) return null;
          const start = polarToCartesian(seg.startAngle);
          const end = polarToCartesian(seg.endAngle);
          const largeArc = seg.endAngle - seg.startAngle > 180 ? 1 : 0;
          const d = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-700"
              style={{ opacity: 0.85 }}
            />
          );
        })}
        {centerLabel && (
          <text x={cx} y={cy + 2} textAnchor="middle" className="text-[8px] font-bold fill-emerald-700">
            {centerLabel}
          </text>
        )}
      </svg>
    </div>
  );
}

// --- BAR CHART ---
function BarChart({ data, maxValue }: { data: MonthlyData[]; maxValue: number }) {
  return (
    <div className="flex items-end gap-1.5 h-32 px-2">
      {data.map((d, i) => {
        const expH = maxValue > 0 ? (d.expenses / maxValue) * 100 : 0;
        const incH = maxValue > 0 ? (d.income / maxValue) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="flex gap-0.5 items-end w-full h-24">
              <div
                className="flex-1 bg-gradient-to-t from-red-300 to-red-400 rounded-t-sm transition-all duration-500"
                style={{ height: `${expH}%`, minHeight: d.expenses > 0 ? "4px" : "0" }}
              />
              <div
                className="flex-1 bg-gradient-to-t from-green-300 to-green-400 rounded-t-sm transition-all duration-500"
                style={{ height: `${incH}%`, minHeight: d.income > 0 ? "4px" : "0" }}
              />
            </div>
            <span className="text-[9px] text-emerald-400 font-medium">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- MINI PIE (for member split) ---
function MemberSplit({ data }: { data: ChartData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex gap-3 justify-center">
      {data.map((d, i) => {
        const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : "0";
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="relative w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke={d.color}
                  strokeWidth="4"
                  strokeDasharray={`${(d.value / total) * 88} 88`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-700">{pct}%</span>
            </div>
            <span className="text-[10px] text-emerald-500">{d.emoji} {d.label}</span>
            <span className="text-[10px] font-semibold text-emerald-700">{d.value.toFixed(0)}€</span>
          </div>
        );
      })}
    </div>
  );
}

// --- MAIN COMPONENT ---
interface ExpenseChartsProps {
  monthExpenses: { amount: number; category: string; date: string; paidBy: string }[];
  allExpenses: { amount: number; category: string; date: string; paidBy: string }[];
  allIncomes: { amount: number; date: string }[];
  categories: { id: string; emoji: string; label: string }[];
  memberNames: { key: string; label: string; emoji: string }[];
  viewMonth: string;
}

const CATEGORY_COLORS = ["#34d399", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6b7280"];

export default function ExpenseCharts({ monthExpenses, allExpenses, allIncomes, categories, memberNames, viewMonth }: ExpenseChartsProps) {
  const { t } = useT();

  // Donut data by category
  const donutData = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return categories
      .map((c, i) => ({ label: c.label, emoji: c.emoji, value: map[c.id] || 0, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
      .filter((d) => d.value > 0);
  }, [monthExpenses, categories]);

  const totalMonth = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses]);

  // Bar chart: last 6 months
  const barData = useMemo(() => {
    const months: MonthlyData[] = [];
    const [y, m] = viewMonth.split("-").map(Number);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-PT", { month: "short" }).slice(0, 3);
      const expenses = allExpenses.filter((e) => e.date?.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      const income = allIncomes.filter((e) => e.date?.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      months.push({ month: label, expenses, income });
    }
    return months;
  }, [allExpenses, allIncomes, viewMonth]);

  const barMax = useMemo(() => Math.max(...barData.map((d) => Math.max(d.expenses, d.income)), 1), [barData]);

  // Member split
  const memberData = useMemo(() => {
    const map: Record<string, number> = {};
    memberNames.forEach((m) => { map[m.key] = 0; });
    monthExpenses.forEach((e) => { map[e.paidBy] = (map[e.paidBy] || 0) + e.amount; });
    return memberNames.map((m, i) => ({
      label: m.label,
      emoji: m.emoji,
      value: map[m.key] || 0,
      color: i === 0 ? "#8b5cf6" : i === 1 ? "#ec4899" : CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [monthExpenses, memberNames]);

  if (monthExpenses.length === 0 && barData.every((d) => d.expenses === 0 && d.income === 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Donut: by category */}
      {donutData.length > 0 && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/30 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 mb-3">{t("expenses.byCategory")}</p>
          <DonutChart data={donutData} total={totalMonth} centerLabel={`${totalMonth.toFixed(0)}€`} />
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {donutData.map((d, i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] text-emerald-600">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.emoji} {d.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bar chart: 6 months */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/30 shadow-sm">
        <p className="text-xs font-semibold text-emerald-600 mb-3">{t("expenses.charts.monthly")}</p>
        <BarChart data={barData} maxValue={barMax} />
        <div className="flex gap-4 justify-center mt-2">
          <span className="flex items-center gap-1 text-[10px] text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-red-400" /> {t("expenses.expenses.label")}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-green-400" /> {t("expenses.income.label")}
          </span>
        </div>
      </div>

      {/* Member split */}
      {memberData.some((d) => d.value > 0) && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/30 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 mb-3">{t("expenses.whoPaid")}</p>
          <MemberSplit data={memberData} />
        </div>
      )}
    </div>
  );
}
