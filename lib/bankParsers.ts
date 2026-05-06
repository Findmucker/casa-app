export interface ParsedTransaction {
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: "expense" | "income";
  category: string;
}

interface PDFRow {
  items: { str: string; x: number }[];
}

function guessCategory(desc: string): string {
  const d = desc.toLowerCase();
  // Compras (groceries/shopping)
  if (/supermercado|continente|pingo doce|lidl|aldi|mercadona|minipreço|intermarche|auchan|e\.leclerc|jumbo|modelo|supercor|mamute/i.test(d)) return "compras";
  if (/compras c\.deb|cofidis/i.test(d)) return "compras";
  // Saúde
  if (/farmácia|farmacia|hospital|clínica|clinica|médico|medico|dentist|ótica|otica|wells/i.test(d)) return "saude";
  // Transporte
  if (/uber(?! eats)|bolt(?! food)|taxi|cp |comboio|metro|gasolina|galp(?! energia)|repsol|bp |estacion|portagem|via verde|\ba[0-9]+\b|pa obidos|pa a8|brisa|a5 pa|lev\.? atm|levantamento atm/i.test(d)) return "transporte";
  // Restaurantes
  if (/restaurante|café|cafe|mcdonald|burger|pizza|sushi|padaria|pastelaria|uber eats|bolt food|glovo|just eat|fortunity food|cafe restauran|imperio|lounge b|sardine|washoku|doce mar|legenda matinal|quiosque/i.test(d)) return "restaurantes";
  // Lazer
  if (/cinema|spotify|netflix|hbo|disney|bilhete|concerto|teatro|steam|playstation|xbox|gaming|proud earth|\boch\b/i.test(d)) return "lazer";
  // Casa
  if (/renda|aluguer|água|agua|luz|eletricidade|gás|gas|internet|vodafone|meo|nos |prestacao|manut.?conta|via direta|real vida seguros|seguro|allianz|fidelidade|endesa|edp|galp energia|municipio|imposto.?selo|digi portugal|débito direto/i.test(d)) return "casa";
  // Transferências pessoais — outros
  if (/trf|tfi|mbway|cxdapp|reembolso|estorno|pagamento a\./i.test(d)) return "outros";
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

// ─── Parse PDF using positioned rows (accurate column detection) ──
export function parsePDFRows(rows: PDFRow[]): ParsedTransaction[] {
  // Detect BPI by content
  const allText = rows.map(r => r.items.map(i => i.str).join(" ")).join(" ");
  if (allText.includes("bancobpi") || allText.includes("BPI") || allText.includes("CONTA VALOR BPI")) {
    return parseBPIRows(rows);
  }
  return [];
}

function parseBPIRows(rows: PDFRow[]): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];

  // Extract year from period
  const allText = rows.map(r => r.items.map(i => i.str).join(" ")).join(" ");
  const periodMatch = allText.match(/(\d{2})\/(\d{2})\/(\d{4})\s+a\s+(\d{2})\/(\d{2})\/(\d{4})/);
  const year = periodMatch ? periodMatch[6] : new Date().getFullYear().toString();

  // BPI columns: date at x≈56-82, description at x≈113, amount at x≈487-494, balance at x≈551-559
  // A transaction row has: a date (DD/MM) at x<100, description at x~113, amount at x>450
  for (const row of rows) {
    const items = row.items;
    if (items.length < 2) continue;

    // Find date item (DD/MM at x < 100)
    const dateItem = items.find(i => i.x < 100 && /^\d{2}\/\d{2}$/.test(i.str));
    if (!dateItem) continue;

    // Find amount item (at x > 450, looks like a number with optional negative sign)
    // The negative sign might be a separate item right before the number
    const amountItem = items.find(i => i.x > 450 && i.x < 540 && /^-?[\d ]+,\d{2}$/.test(i.str.trim()));
    if (!amountItem) continue;

    // Check if there's a separate "-" sign item just before the amount (within 15px)
    const negSignItem = items.find(i => i.x > 440 && i.x < amountItem.x && /^-$/.test(i.str.trim()));

    // Description: items between x=100 and x=450
    const descItems = items.filter(i => i.x >= 100 && i.x < 450 && i.str.trim());
    let desc = descItems.map(i => i.str).join(" ").trim();

    // Skip non-transaction rows — extensive filtering
    const skipPatterns = [
      "SALDO ANTERIOR", "DESCRIÇÃO", "Sede:", "IBAN", "NIB",
      "EXTRACTO", "DEPÓSITOS", "Capital Social", "matriculada",
      "bancobpi", "BPI Direto", "ACTIVOS", "PASSIVOS",
      "Emissão", "NUC", "Período", "Banco BPI",
      "Rua Tenente", "Lisboa", "Porto", "NIPC", "Reg. Conserv",
      "www.bancobpi", "TOTAL", "Conta n", "Titular",
      "SA ", "S.A.", "Pág.", "Página", "SWIFT",
    ];
    if (skipPatterns.some(p => desc.includes(p))) continue;
    // Skip lines that are mostly numbers (account numbers, codes)
    if (/^\d[\d\s./]{6,}$/.test(desc)) continue;
    // Skip very short descriptions
    if (desc.length < 3) continue;

    // Parse date
    const day = dateItem.str.slice(0, 2);
    const month = dateItem.str.slice(3, 5);
    const date = `${year}-${month}-${day}`;

    // Parse amount
    const amountStr = amountItem.str.trim();
    const amount = parseAmount(amountStr.replace(/\s/g, ""));
    if (amount === 0) continue;

    // Determine if expense: check for explicit "-" in the amount or a separate "-" item
    const isNegative = amountStr.startsWith("-") || !!negSignItem;

    // Clean description — extract meaningful merchant name
    desc = desc.replace(/^\d{2}\/\d{2}\s+/, ""); // Remove leading date
    desc = desc.replace(/COMPRA ELEC\.?\s*\d*\/?\d*\s*/gi, "").trim();
    desc = desc.replace(/PAGAMENTO DE SERVICOS\s*/gi, "").trim();
    desc = desc.replace(/TRANSF\.\s*/gi, "Transferência ").trim();
    desc = desc.replace(/TRF\s*/gi, "Transferência ").trim();
    desc = desc.replace(/LEV\.?\s*ATM\s*/gi, "Levantamento ATM").trim();
    desc = desc.replace(/DD\s*/gi, "Débito Direto ").trim();
    // Remove trailing reference numbers and location codes
    desc = desc.replace(/\s{2,}.*$/, "").trim();
    desc = desc.replace(/\s+\d{4,}$/, "").trim();
    // Capitalize first letter
    if (desc.length > 0) desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    if (!desc || desc.length < 2) desc = "Movimento BPI";

    results.push({
      description: desc.slice(0, 80),
      amount,
      date,
      type: isNegative ? "expense" : "income",
      category: guessCategory(desc),
    });
  }

  return results;
}

// ─── Parse raw text extracted from PDF ───────────────────────
// Only used as fallback when parsePDFRows doesn't find results
export function parsePDFText(text: string): ParsedTransaction[] {
  // Only try CGD format (full dates DD-MM-YYYY work reliably with text)
  // BPI is handled by parsePDFRows (position-based) which is much more accurate
  return parseCGDPDF(text);
}

function parseCGDPDF(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];

  // CGD PDF pattern: DD-MM-YYYY   DD-MM-YYYY   DESCRIPTION   -AMOUNT   BALANCE
  const cgdPattern = /(\d{2}-\d{2}-\d{4})\s+\d{2}-\d{2}-\d{4}\s+(.+?)\s+(-?[\d.,]+)\s+(-?[\d.,]+)(?:\s|$)/g;

  let match;
  while ((match = cgdPattern.exec(text)) !== null) {
    const date = parseDate(match[1]);
    let desc = match[2].trim();
    const amount = parseAmount(match[3]);

    if (amount === 0) continue;
    const isNegative = match[3].trim().startsWith("-");

    // Clean CGD descriptions
    desc = desc.replace(/COMPRA ELECTR[OÓ]NICA\s*/gi, "").trim();
    desc = desc.replace(/PAGAMENTO DE SERVICOS\s*/gi, "").trim();
    desc = desc.replace(/TRANSF\.\s*/gi, "Transferência ").trim();
    desc = desc.replace(/TRF\s*/gi, "Transferência ").trim();
    desc = desc.replace(/LEV\.?\s*MULTIBANCO\s*/gi, "Levantamento ATM").trim();
    desc = desc.replace(/\s+\d{8,}$/, "").trim(); // Remove trailing reference numbers
    if (desc.length > 0) desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    if (!desc || desc.length < 2) desc = "Movimento CGD";

    results.push({
      description: desc.slice(0, 80),
      amount,
      date,
      type: isNegative ? "expense" : "income",
      category: guessCategory(desc),
    });
  }

  return results;
}
