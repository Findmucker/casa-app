import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ExpenseCharts from "@/components/ExpenseCharts";

let mockLocale: "pt" | "en" = "pt";

jest.mock("@/lib/i18n", () => ({
  useT: () => ({
    locale: mockLocale,
    t: (key: string) => key,
  }),
}));

const categories = [{ id: "compras", emoji: "🛒", label: "Compras" }];
const members = [{ key: "eduardo", label: "Eduardo", emoji: "👤" }];

describe("ExpenseCharts", () => {
  beforeEach(() => {
    mockLocale = "pt";
  });

  it("does not render bar elements for months with zero values", () => {
    render(
      <ExpenseCharts
        monthExpenses={[]}
        allExpenses={[
          { amount: 50, category: "compras", date: "2026-06-10", paidBy: "eduardo" },
        ]}
        allIncomes={[]}
        categories={categories}
        memberNames={members}
        viewMonth="2026-07"
      />
    );

    expect(screen.getAllByTestId("expense-bar")).toHaveLength(1);
    expect(screen.queryByTestId("income-bar")).not.toBeInTheDocument();
  });

  it("does not render charts when all six months are empty", () => {
    const { container } = render(
      <ExpenseCharts
        monthExpenses={[]}
        allExpenses={[]}
        allIncomes={[]}
        categories={[]}
        memberNames={[]}
        viewMonth="2026-07"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a complete donut ring for a single category", () => {
    render(
      <ExpenseCharts
        monthExpenses={[
          { amount: 50, category: "compras", date: "2026-07-10", paidBy: "eduardo" },
        ]}
        allExpenses={[
          { amount: 50, category: "compras", date: "2026-07-10", paidBy: "eduardo" },
        ]}
        allIncomes={[]}
        categories={categories}
        memberNames={members}
        viewMonth="2026-07"
      />
    );

    const segment = screen.getByTestId("donut-segment");
    const [ringLength, gapLength] = (segment.getAttribute("stroke-dasharray") ?? "").split(" ").map(Number);

    expect(ringLength).toBeGreaterThan(0);
    expect(gapLength).toBeCloseTo(0);
    expect(screen.getByRole("img", { name: "expenses.byCategory" })).toBeInTheDocument();
  });

  it("ignores non-positive and non-finite amounts consistently", () => {
    const { container } = render(
      <ExpenseCharts
        monthExpenses={[
          { amount: -50, category: "compras", date: "2026-07-10", paidBy: "eduardo" },
          { amount: Number.NaN, category: "compras", date: "2026-07-11", paidBy: "eduardo" },
        ]}
        allExpenses={[
          { amount: Number.POSITIVE_INFINITY, category: "compras", date: "2026-07-10", paidBy: "eduardo" },
        ]}
        allIncomes={[{ amount: 0, date: "2026-07-10" }]}
        categories={categories}
        memberNames={members}
        viewMonth="2026-07"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("uses the active locale for month labels", () => {
    mockLocale = "en";

    render(
      <ExpenseCharts
        monthExpenses={[]}
        allExpenses={[
          { amount: 50, category: "compras", date: "2026-06-10", paidBy: "eduardo" },
        ]}
        allIncomes={[]}
        categories={categories}
        memberNames={members}
        viewMonth="2026-07"
      />
    );

    expect(screen.getByText("Jun")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "expenses.charts.monthly" })).toBeInTheDocument();
  });
});
