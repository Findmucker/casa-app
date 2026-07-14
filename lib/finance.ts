export type FinanceLocale = "pt" | "en";

export interface MonthlyAmount {
  amount: number;
  date: string;
}

export interface MonthlyFinancePoint {
  key: string;
  month: string;
  expenses: number;
  income: number;
}

export function parsePositiveAmount(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function positiveAmount(value: unknown): number {
  return parsePositiveAmount(value) ?? 0;
}

export function formatEuro(value: number, locale: FinanceLocale): string {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(positiveAmount(value));
}

export function buildMonthlyFinanceSeries(
  viewMonth: string,
  expenses: MonthlyAmount[],
  incomes: MonthlyAmount[],
  locale: FinanceLocale
): MonthlyFinancePoint[] {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(viewMonth);
  if (!match) return [];

  const year = Number(match[1]);
  const month = Number(match[2]);
  const points: MonthlyFinancePoint[] = [];
  const pointByKey = new Map<string, MonthlyFinancePoint>();
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pt-PT", {
    month: "short",
  });

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(year, month - 1 - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const point = {
      key,
      month: formatter.format(date).replace(/\.$/, ""),
      expenses: 0,
      income: 0,
    };
    points.push(point);
    pointByKey.set(key, point);
  }

  const addValues = (
    entries: MonthlyAmount[],
    field: "expenses" | "income"
  ) => {
    for (const entry of entries) {
      const point = pointByKey.get(entry.date?.slice(0, 7));
      const amount = positiveAmount(entry.amount);
      if (point && amount > 0) point[field] += amount;
    }
  };

  addValues(expenses, "expenses");
  addValues(incomes, "income");

  return points;
}
