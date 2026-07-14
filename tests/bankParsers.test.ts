import {
  buildTransactionKey,
  isValidTransactionDate,
  parseCSV,
  parsePDFRows,
} from "@/lib/bankParsers";

describe("bankParsers", () => {
  it("parses European thousands and decimal separators in BPI CSV files", () => {
    const csv = [
      "Data Mov.;Data Valor;Descrição;Valor;Saldo",
      "14/07/26;14/07/26;Continente;-1.234,56;2.000,00",
      "15/07/26;15/07/26;Salário;2.345,67;4.345,67",
    ].join("\n");

    expect(parseCSV(csv)).toEqual([
      {
        description: "Continente",
        amount: 1234.56,
        date: "2026-07-14",
        type: "expense",
        category: "compras",
      },
      {
        description: "Salário",
        amount: 2345.67,
        date: "2026-07-15",
        type: "income",
        category: "outros",
      },
    ]);
  });

  it("accepts BOM and Excel separator directives in CGD exports", () => {
    const csv = [
      "\uFEFFsep=;",
      "Data movimento;Data valor;Descrição;Débito;Crédito;Saldo contabilístico;Saldo disponível",
      "14-07-2026;14-07-2026;Pingo Doce;1.234,56;;2.000,00;2.000,00",
    ].join("\n");

    expect(parseCSV(csv)).toHaveLength(1);
    expect(parseCSV(csv)[0]).toMatchObject({
      description: "Pingo Doce",
      amount: 1234.56,
      date: "2026-07-14",
      type: "expense",
    });
  });

  it("discards impossible transaction dates", () => {
    const csv = [
      "Data;Descrição;Valor;Saldo",
      "31/02/2026;Supermercado;-20,00;100,00",
    ].join("\n");

    expect(parseCSV(csv)).toEqual([]);
    expect(isValidTransactionDate("2026-02-31")).toBe(false);
  });

  it("detects duplicates despite case, spacing, or amount sign differences", () => {
    expect(buildTransactionKey("  Pingo   Doce ", -12.5, "2026-07-14"))
      .toBe(buildTransactionKey("pingo doce", 12.50, "2026-07-14"));
  });

  it("parses positioned BPI PDF rows and a separate minus sign", () => {
    const rows = [
      { items: [{ str: "Banco BPI", x: 10 }, { str: "01/01/2026 a 31/12/2026", x: 100 }] },
      {
        items: [
          { str: "14/07", x: 55 },
          { str: "COMPRA ELEC. CONTINENTE", x: 120 },
          { str: "-", x: 470 },
          { str: "45,67", x: 490 },
          { str: "100,00", x: 555 },
        ],
      },
    ];

    expect(parsePDFRows(rows)).toEqual([
      {
        description: "CONTINENTE",
        amount: 45.67,
        date: "2026-07-14",
        type: "expense",
        category: "compras",
      },
    ]);
  });
});
