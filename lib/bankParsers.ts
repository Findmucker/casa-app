export interface ParsedTransaction {
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: "expense" | "income";
  category: string;
}

function guessCategory(desc: string): string {
  const d = desc.toLowerCase();
  if (/supermercado|continente|pingo doce|lidl|aldi|mercadona|minipreço/i.test(d)) return "compras";
  if (/farmácia|farmacia|hospital|clínica|clinica|médico|medico/i.test(d)) return "saude";
  if (/uber|bolt|taxi|cp |comboio|metro|gasolina|galp|repsol|bp |estacion/i.test(d)) return "transporte";
  if (/restaurante|café|cafe|mcdonald|burger|pizza|sushi|padaria|pastelaria/i.test(d)) return "restaurantes";
  if (/cinema|spotify|netflix|hbo|disney|bilhete|concerto|teatro/i.test(d)) return "lazer";
  if (/renda|aluguer|água|agua|luz|eletricidade|gás|gas|internet|vodafone|meo|nos /i.test(d)) return "casa";
  return "outros";
}

function parseDate(raw: string): string {
  // Try DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const dmy = raw.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const ymd = raw.match(/(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
  return new Date().toISOString().split("T")[0];
}

function parseAmount(raw: string): number {
  // Handle European format: 1.234,56 or 1234,56
  let cleaned = raw.replace(/[€\s]/g, "").trim();
  // If has comma as decimal separator
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    cleaned = cleaned.replace(",", ".");
  } else if (cleaned.includes(",") && cleaned.includes(".")) {
    // 1.234,56 format
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  return Math.abs(parseFloat(cleaned) || 0);
}

function splitCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === separator && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

// ─── CGD (Caixa Geral de Depósitos) ──────────────────────────
function parseCGD(lines: string[]): ParsedTransaction[] {
  // CGD format: Data movimento;Data valor;Descrição;Débito;Crédito;Saldo contabilístico;Saldo disponível
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    const cols = splitCSVLine(line, ";");
    if (cols.length < 5) continue;
    const date = parseDate(cols[0]);
    const desc = cols[2] || "";
    const debit = parseAmount(cols[3]);
    const credit = parseAmount(cols[4]);
    if (debit > 0) results.push({ description: desc, amount: debit, date, type: "expense", category: guessCategory(desc) });
    else if (credit > 0) results.push({ description: desc, amount: credit, date, type: "income", category: guessCategory(desc) });
  }
  return results;
}

// ─── BPI ─────────────────────────────────────────────────────
function parseBPI(lines: string[]): ParsedTransaction[] {
  // BPI format: Data Mov.;Data Valor;Descrição;Valor;Saldo
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    const cols = splitCSVLine(line, ";");
    if (cols.length < 4) continue;
    const date = parseDate(cols[0]);
    const desc = cols[2] || "";
    const amount = parseFloat(cols[3].replace(/[€\s]/g, "").replace(",", ".")) || 0;
    if (amount < 0) results.push({ description: desc, amount: Math.abs(amount), date, type: "expense", category: guessCategory(desc) });
    else if (amount > 0) results.push({ description: desc, amount, date, type: "income", category: guessCategory(desc) });
  }
  return results;
}

// ─── Millennium BCP ──────────────────────────────────────────
function parseMillennium(lines: string[]): ParsedTransaction[] {
  // Millennium: Data;Descrição;Valor;Saldo
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    const cols = splitCSVLine(line, ";");
    if (cols.length < 3) continue;
    const date = parseDate(cols[0]);
    const desc = cols[1] || "";
    const amount = parseFloat(cols[2].replace(/[€\s]/g, "").replace(",", ".")) || 0;
    if (amount < 0) results.push({ description: desc, amount: Math.abs(amount), date, type: "expense", category: guessCategory(desc) });
    else if (amount > 0) results.push({ description: desc, amount, date, type: "income", category: guessCategory(desc) });
  }
  return results;
}

// ─── Revolut ─────────────────────────────────────────────────
function parseRevolut(lines: string[]): ParsedTransaction[] {
  // Revolut CSV: Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    const cols = splitCSVLine(line, ",");
    if (cols.length < 6) continue;
    const dateRaw = cols[2] || cols[3] || "";
    const date = parseDate(dateRaw.split(" ")[0]);
    const desc = cols[4] || "";
    const amount = parseFloat(cols[5]) || 0;
    if (amount < 0) results.push({ description: desc, amount: Math.abs(amount), date, type: "expense", category: guessCategory(desc) });
    else if (amount > 0) results.push({ description: desc, amount, date, type: "income", category: guessCategory(desc) });
  }
  return results;
}

// ─── Moey ────────────────────────────────────────────────────
function parseMoey(lines: string[]): ParsedTransaction[] {
  // Moey: Data;Descrição;Montante;Saldo
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    const cols = splitCSVLine(line, ";");
    if (cols.length < 3) continue;
    const date = parseDate(cols[0]);
    const desc = cols[1] || "";
    const amount = parseFloat(cols[2].replace(/[€\s]/g, "").replace(",", ".")) || 0;
    if (amount < 0) results.push({ description: desc, amount: Math.abs(amount), date, type: "expense", category: guessCategory(desc) });
    else if (amount > 0) results.push({ description: desc, amount, date, type: "income", category: guessCategory(desc) });
  }
  return results;
}

// ─── ActivoBank ──────────────────────────────────────────────
function parseActivoBank(lines: string[]): ParsedTransaction[] {
  // ActivoBank: Data;Descrição;Débito;Crédito;Saldo
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    const cols = splitCSVLine(line, ";");
    if (cols.length < 4) continue;
    const date = parseDate(cols[0]);
    const desc = cols[1] || "";
    const debit = parseAmount(cols[2]);
    const credit = parseAmount(cols[3]);
    if (debit > 0) results.push({ description: desc, amount: debit, date, type: "expense", category: guessCategory(desc) });
    else if (credit > 0) results.push({ description: desc, amount: credit, date, type: "income", category: guessCategory(desc) });
  }
  return results;
}

// ─── Auto-detect and parse ───────────────────────────────────
export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();

  // Detect bank by header patterns
  if (header.includes("tipo") && header.includes("product") || header.includes("type,product")) {
    return parseRevolut(lines.slice(1));
  }
  if (header.includes("débito") && header.includes("crédito") && header.includes("saldo contabilístico")) {
    return parseCGD(lines.slice(1));
  }
  if (header.includes("data mov") && header.includes("descrição") && header.includes("valor") && header.includes("saldo")) {
    return parseBPI(lines.slice(1));
  }
  if (header.includes("data") && header.includes("descrição") && header.includes("débito") && header.includes("crédito")) {
    return parseActivoBank(lines.slice(1));
  }
  if (header.includes("data") && header.includes("montante") && header.includes("saldo")) {
    return parseMoey(lines.slice(1));
  }
  if (header.includes("data") && header.includes("descrição") && header.includes("valor")) {
    return parseMillennium(lines.slice(1));
  }

  // Fallback: try generic semicolon-separated with date detection
  const separator = header.includes(";") ? ";" : ",";
  const results: ParsedTransaction[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCSVLine(line, separator);
    if (cols.length < 3) continue;
    // Try to find date, description, and amount columns
    const dateCol = cols.find((c) => /\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}/.test(c));
    const amountCol = cols.find((c) => /^-?[\d.,]+€?$/.test(c.trim()));
    const descCol = cols.find((c) => c.length > 3 && !/^[\d.,€\-\s]+$/.test(c) && !/\d{1,2}[/\-]/.test(c));
    if (amountCol) {
      const amount = parseFloat(amountCol.replace(/[€\s]/g, "").replace(",", ".")) || 0;
      const desc = descCol || "Transação";
      const date = dateCol ? parseDate(dateCol) : new Date().toISOString().split("T")[0];
      if (amount < 0) results.push({ description: desc, amount: Math.abs(amount), date, type: "expense", category: guessCategory(desc) });
      else if (amount > 0) results.push({ description: desc, amount, date, type: "income", category: guessCategory(desc) });
    }
  }
  return results;
}

// ─── Parse raw text extracted from PDF ───────────────────────
// Handles messy text from pdf.js where structure is lost
export function parsePDFText(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];

  // CGD PDF pattern: DD-MM-YYYY   DD-MM-YYYY   DESCRIPTION   -AMOUNT   BALANCE
  // The text from pdf.js joins items with spaces, so we look for the pattern:
  // date date description amount balance
  const cgdPattern = /(\d{2}-\d{2}-\d{4})\s+\d{2}-\d{2}-\d{4}\s+(.+?)\s+(-?[\d.,]+)\s+(-?[\d.,]+)(?:\s|$)/g;

  let match;
  while ((match = cgdPattern.exec(text)) !== null) {
    const date = parseDate(match[1]);
    const desc = match[2].trim();
    const amount = parseAmount(match[3]);
    const balance = parseAmount(match[4]);

    if (amount === 0) continue;
    // Skip if this looks like the balance column was captured as amount
    // (balance is usually larger than individual transactions)
    // Use the sign from the original string
    const isNegative = match[3].trim().startsWith("-");

    results.push({
      description: desc.slice(0, 80),
      amount,
      date,
      type: isNegative ? "expense" : "income",
      category: guessCategory(desc),
    });
  }

  if (results.length > 0) return results;

  // Generic fallback: find date + amount patterns in each line
  const lines = text.split(/\n/);
  const datePattern = /(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})/g;
  const amountPattern = /(-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€?/g;

  for (const line of lines) {
    const dates = line.match(datePattern);
    const amounts = line.match(amountPattern);

    if (!dates || !amounts) continue;

    const date = parseDate(dates[0]);
    const lastAmountStr = amounts[amounts.length - 1];
    const amount = parseAmount(lastAmountStr);

    if (amount === 0) continue;

    let desc = line;
    desc = desc.replace(/\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}/g, "").replace(/(-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€?/g, "").trim();
    desc = desc.replace(/\s{2,}/g, " ").trim();
    if (!desc || desc.length < 2) desc = "Transação";
    desc = desc.slice(0, 80);

    const isNegative = lastAmountStr.trim().startsWith("-");

    results.push({
      description: desc,
      amount,
      date,
      type: isNegative ? "expense" : "income",
      category: guessCategory(desc),
    });
  }

  return results;
}
