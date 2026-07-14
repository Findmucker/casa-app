import {
  buildMonthlyFinanceSeries,
  formatEuro,
  parsePositiveAmount,
  positiveAmount,
} from "@/lib/finance";

describe("finance helpers", () => {
  it("accepts only finite positive amounts", () => {
    expect(parsePositiveAmount("12.50")).toBe(12.5);
    expect(parsePositiveAmount(1)).toBe(1);
    expect(parsePositiveAmount("")).toBeNull();
    expect(parsePositiveAmount(0)).toBeNull();
    expect(parsePositiveAmount(-10)).toBeNull();
    expect(parsePositiveAmount(Number.POSITIVE_INFINITY)).toBeNull();
    expect(positiveAmount(Number.NaN)).toBe(0);
  });

  it("builds a localized six-month series and ignores invalid values", () => {
    const series = buildMonthlyFinanceSeries(
      "2026-07",
      [
        { amount: 50, date: "2026-06-10" },
        { amount: -20, date: "2026-06-11" },
        { amount: Number.NaN, date: "2026-07-01" },
      ],
      [{ amount: 100, date: "2026-07-02" }],
      "en"
    );

    expect(series).toHaveLength(6);
    expect(series.at(-2)).toMatchObject({ key: "2026-06", month: "Jun", expenses: 50, income: 0 });
    expect(series.at(-1)).toMatchObject({ key: "2026-07", month: "Jul", expenses: 0, income: 100 });
  });

  it("rejects an invalid view month", () => {
    expect(buildMonthlyFinanceSeries("2026-13", [], [], "pt")).toEqual([]);
  });

  it("formats euro values with the active locale", () => {
    expect(formatEuro(1250, "pt")).toContain("1");
    expect(formatEuro(1250, "en")).toContain("€");
  });
});
