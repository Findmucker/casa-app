import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ExpenseCharts from "@/components/ExpenseCharts";

jest.mock("@/lib/i18n", () => ({
  useT: () => ({ t: (key: string) => key }),
}));

describe("ExpenseCharts", () => {
  it("does not render bar elements for months with zero values", () => {
    render(
      <ExpenseCharts
        monthExpenses={[]}
        allExpenses={[
          { amount: 50, category: "compras", date: "2026-06-10", paidBy: "eduardo" },
        ]}
        allIncomes={[]}
        categories={[{ id: "compras", emoji: "🛒", label: "Compras" }]}
        memberNames={[{ key: "eduardo", label: "Eduardo", emoji: "👤" }]}
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
});
