"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n";
import {
  buildMonthlyFinanceSeries,
  formatEuro,
  positiveAmount,
  type FinanceLocale,
  type MonthlyFinancePoint,
} from "@/lib/finance";

interface ChartData {
  id: string;
  label: string;
  value: number;
  color: string;
  emoji?: string;
}

interface DonutSegment extends ChartData {
  dashLength: number;
  dashOffset: number;
}

const CATEGORY_COLORS = ["#059669", "#0891b2", "#7c3aed", "#d97706", "#dc2626", "#db2777", "#4b5563"];
const DONUT_RADIUS = 40;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function DonutChart({
  data,
  total,
  centerLabel,
  label,
}: {
  data: ChartData[];
  total: number;
  centerLabel: string;
  label: string;
}) {
  const segments = data.reduce<DonutSegment[]>((result, item) => {
    const dashLength = total > 0 ? (item.value / total) * DONUT_CIRCUMFERENCE : 0;
    const dashOffset = result.reduce((sum, segment) => sum + segment.dashLength, 0);
    result.push({ ...item, dashLength, dashOffset });
    return result;
  }, []);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full max-w-[160px] mx-auto"
        role="img"
        aria-label={label}
      >
        <title>{label}</title>
        <circle
          cx="50"
          cy="50"
          r={DONUT_RADIUS}
          fill="none"
          stroke="#d1fae5"
          strokeWidth="16"
        />
        {segments.map((segment) => (
          <circle
            key={segment.id}
            data-testid="donut-segment"
            cx="50"
            cy="50"
            r={DONUT_RADIUS}
            fill="none"
            stroke={segment.color}
            strokeWidth="16"
            strokeDasharray={`${segment.dashLength} ${DONUT_CIRCUMFERENCE - segment.dashLength}`}
            strokeDashoffset={-segment.dashOffset}
            strokeLinecap="butt"
            transform="rotate(-90 50 50)"
            className="transition-all duration-700"
          />
        ))}
        <text x="50" y="52" textAnchor="middle" className="text-[8px] font-bold fill-emerald-700">
          {centerLabel}
        </text>
      </svg>
    </div>
  );
}

function BarChart({
  data,
  maxValue,
  label,
  locale,
}: {
  data: MonthlyFinancePoint[];
  maxValue: number;
  label: string;
  locale: FinanceLocale;
}) {
  return (
    <div className="flex items-end gap-1.5 h-32 px-2" role="img" aria-label={label}>
      {data.map((point) => {
        const expenseHeight = maxValue > 0 ? (point.expenses / maxValue) * 100 : 0;
        const incomeHeight = maxValue > 0 ? (point.income / maxValue) * 100 : 0;
        return (
          <div key={point.key} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="flex gap-0.5 items-end w-full h-24">
              <div className="flex-1 h-full flex items-end">
                {point.expenses > 0 && (
                  <div
                    data-testid="expense-bar"
                    title={`${point.month}: ${formatEuro(point.expenses, locale)}`}
                    className="w-full bg-gradient-to-t from-rose-400 to-red-500 rounded-t-sm transition-all duration-500"
                    style={{ height: `${expenseHeight}%`, minHeight: "4px" }}
                  />
                )}
              </div>
              <div className="flex-1 h-full flex items-end">
                {point.income > 0 && (
                  <div
                    data-testid="income-bar"
                    title={`${point.month}: ${formatEuro(point.income, locale)}`}
                    className="w-full bg-gradient-to-t from-emerald-400 to-green-500 rounded-t-sm transition-all duration-500"
                    style={{ height: `${incomeHeight}%`, minHeight: "4px" }}
                  />
                )}
              </div>
            </div>
            <span className="text-[9px] text-emerald-500 font-medium">{point.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function MemberSplit({
  data,
  label,
  locale,
}: {
  data: ChartData[];
  label: string;
  locale: FinanceLocale;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex gap-3 justify-center flex-wrap" aria-label={label}>
      {data.map((item) => {
        const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.id} className="flex flex-col items-center gap-1">
            <div className="relative w-12 h-12">
              <svg
                viewBox="0 0 36 36"
                className="w-full h-full -rotate-90"
                role="img"
                aria-label={`${item.label}: ${formatEuro(item.value, locale)}, ${percentage}%`}
              >
                <circle cx="18" cy="18" r="14" fill="none" stroke="#d1fae5" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="4"
                  strokeDasharray={`${(item.value / total) * 88} 88`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                {percentage}%
              </span>
            </div>
            <span className="text-[10px] text-emerald-600">{item.emoji} {item.label}</span>
            <span className="text-[10px] font-semibold text-emerald-800">{formatEuro(item.value, locale)}</span>
          </div>
        );
      })}
    </div>
  );
}

interface ExpenseChartsProps {
  monthExpenses: { amount: number; category: string; date: string; paidBy: string }[];
  allExpenses: { amount: number; category: string; date: string; paidBy: string }[];
  allIncomes: { amount: number; date: string }[];
  categories: { id: string; emoji: string; label: string }[];
  memberNames: { key: string; label: string; emoji: string }[];
  viewMonth: string;
}

export default function ExpenseCharts({
  monthExpenses,
  allExpenses,
  allIncomes,
  categories,
  memberNames,
  viewMonth,
}: ExpenseChartsProps) {
  const { t, locale } = useT();

  const donutData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const expense of monthExpenses) {
      const amount = positiveAmount(expense.amount);
      if (amount > 0) totals.set(expense.category, (totals.get(expense.category) ?? 0) + amount);
    }

    return categories
      .map((category, index) => ({
        id: category.id,
        label: category.label,
        emoji: category.emoji,
        value: totals.get(category.id) ?? 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .filter((item) => item.value > 0);
  }, [monthExpenses, categories]);

  const totalMonth = useMemo(
    () => donutData.reduce((sum, item) => sum + item.value, 0),
    [donutData]
  );

  const barData = useMemo(
    () => buildMonthlyFinanceSeries(viewMonth, allExpenses, allIncomes, locale),
    [allExpenses, allIncomes, locale, viewMonth]
  );

  const barMax = useMemo(
    () => Math.max(...barData.map((item) => Math.max(item.expenses, item.income)), 1),
    [barData]
  );

  const memberData = useMemo(() => {
    const totals = new Map(memberNames.map((member) => [member.key, 0]));
    for (const expense of monthExpenses) {
      const amount = positiveAmount(expense.amount);
      if (amount > 0 && totals.has(expense.paidBy)) {
        totals.set(expense.paidBy, (totals.get(expense.paidBy) ?? 0) + amount);
      }
    }

    return memberNames
      .map((member, index) => ({
        id: member.key,
        label: member.label,
        emoji: member.emoji,
        value: totals.get(member.key) ?? 0,
        color: index === 0 ? "#7c3aed" : index === 1 ? "#db2777" : CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .filter((item) => item.value > 0);
  }, [monthExpenses, memberNames]);

  const hasMonthlyActivity = barData.some((item) => item.expenses > 0 || item.income > 0);
  if (totalMonth === 0 && !hasMonthlyActivity) return null;

  const categoryLabel = t("expenses.byCategory");
  const monthlyLabel = t("expenses.charts.monthly");
  const memberLabel = t("expenses.whoPaid");

  return (
    <div className="space-y-4">
      {donutData.length > 0 && (
        <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/30 shadow-sm">
          <h3 className="text-xs font-semibold text-emerald-700 mb-3">{categoryLabel}</h3>
          <DonutChart
            data={donutData}
            total={totalMonth}
            centerLabel={formatEuro(totalMonth, locale)}
            label={categoryLabel}
          />
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {donutData.map((item) => (
              <span key={item.id} className="flex items-center gap-1 text-[10px] text-emerald-700">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.emoji} {item.label}
              </span>
            ))}
          </div>
        </section>
      )}

      {hasMonthlyActivity && (
        <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/30 shadow-sm">
          <h3 className="text-xs font-semibold text-emerald-700 mb-3">{monthlyLabel}</h3>
          <BarChart data={barData} maxValue={barMax} label={monthlyLabel} locale={locale} />
          <div className="flex gap-4 justify-center mt-2">
            <span className="flex items-center gap-1 text-[10px] text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-red-500" /> {t("expenses.expenses.label")}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-green-500" /> {t("expenses.income.label")}
            </span>
          </div>
        </section>
      )}

      {memberData.length > 0 && (
        <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/30 shadow-sm">
          <h3 className="text-xs font-semibold text-emerald-700 mb-3">{memberLabel}</h3>
          <MemberSplit data={memberData} label={memberLabel} locale={locale} />
        </section>
      )}
    </div>
  );
}
