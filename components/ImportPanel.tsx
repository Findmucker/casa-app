"use client";

import { useState, useRef } from "react";
import { useT } from "@/lib/i18n";
import {
  buildTransactionKey,
  isValidTransactionDate,
  parseCSV,
  parsePDFText,
  parsePDFRows,
  type ParsedTransaction,
} from "@/lib/bankParsers";
import { pdfToRows } from "@/lib/pdfToImage";
import MiniAvatar from "./MiniAvatar";

interface ImportPanelProps {
  onClose: () => void;
  onImport: (items: ParsedTransaction[], owner: string) => Promise<number>;
  existingExpenses: { name: string; amount: number; date?: string }[];
  existingIncome: { name: string; amount: number; date?: string }[];
  memberNames: { key: string; label: string }[];
  currentUser: string;
}

const CATEGORIES = [
  { id: "casa", emoji: "🏠" },
  { id: "compras", emoji: "🛒" },
  { id: "restaurantes", emoji: "🍜" },
  { id: "transporte", emoji: "🚗" },
  { id: "lazer", emoji: "🎉" },
  { id: "saude", emoji: "💊" },
  { id: "outros", emoji: "🌸" },
];

type ViewState = "choose" | "loading" | "preview" | "done";

export default function ImportPanel({ onClose, onImport, existingExpenses, existingIncome, memberNames, currentUser }: ImportPanelProps) {
  const { t } = useT();
  const [view, setView] = useState<ViewState>("choose");
  const [items, setItems] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [owner, setOwner] = useState(currentUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImportable = (item: ParsedTransaction) =>
    item.description.trim().length > 0
    && Number.isFinite(item.amount)
    && item.amount > 0
    && isValidTransactionDate(item.date);

  const isDuplicate = (item: ParsedTransaction, index = -1) => {
    const key = buildTransactionKey(item.description, item.amount, item.date);
    const exists = item.type === "expense"
      ? existingExpenses.some((entry) => buildTransactionKey(entry.name, entry.amount, entry.date || "") === key)
      : existingIncome.some((entry) => buildTransactionKey(entry.name, entry.amount, entry.date || "") === key);
    if (exists) return true;

    return index >= 0 && items
      .slice(0, index)
      .some((entry) =>
        entry.type === item.type
        && buildTransactionKey(entry.description, entry.amount, entry.date) === key
      );
  };

  const handleFile = async (file: File) => {
    setError(null);

    // CSV files — parse client-side
    if (file.name.endsWith(".csv") || file.type === "text/csv") {
      setView("loading");
      try {
        const text = await file.text();
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setError(t("import.noItems"));
          setView("choose");
          return;
        }
        setItems(parsed);
        setView("preview");
      } catch {
        setError(t("import.error"));
        setView("choose");
      }
      return;
    }

    // PDFs are parsed locally from their embedded, positioned text.
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setView("loading");
      try {
        const rows = await pdfToRows(file);
        const text = rows.map((row) => row.items.map((item) => item.str).join(" ")).join("\n");
        const positionedResults = parsePDFRows(rows);
        const parsed = positionedResults.length > 0 ? positionedResults : parsePDFText(text);

        if (parsed.length === 0) {
          setError(t("import.noItems"));
          setView("choose");
          return;
        }

        setItems(parsed);
        setView("preview");
      } catch (err) {
        console.error("Local PDF processing error:", err);
        setError(err instanceof Error ? err.message : t("import.error"));
        setView("choose");
      }
      return;
    }

    setError(t("import.error"));
  };

  const toggleType = (idx: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, type: item.type === "expense" ? "income" : "expense" } : item
      )
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ParsedTransaction, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleConfirm = async () => {
    setView("loading");
    try {
      const count = await onImport(items, owner);
      setImportedCount(count);
      setView("done");
    } catch {
      setError(t("import.error"));
      setView("preview");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in-up bg-gradient-to-br from-emerald-50/98 via-teal-50/98 to-green-50/98 backdrop-blur-md overscroll-none" onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white/60 backdrop-blur-sm border-b border-emerald-100/40">
        <h2 className="text-lg font-bold text-emerald-600">{t("import.title")}</h2>
        <button
          onClick={onClose}
          className="text-sm text-emerald-400 hover:text-emerald-600 transition-all active:scale-95"
        >
          ✕
        </button>
      </div>

      <div className="p-5">
        {/* Error toast */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200/50 text-sm text-red-600 text-center animate-fade-in-up">
            {error}
          </div>
        )}

        {/* Choose view */}
        {view === "choose" && (
          <div className="space-y-4 max-w-sm mx-auto pt-10">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🪄</div>
              <p className="text-sm text-emerald-500">{t("import.title")}</p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-5 rounded-[28px] bg-white/80 border border-emerald-100/40 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              <span className="text-3xl">📜</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-emerald-700">{t("import.chooseFile")}</p>
                <p className="text-xs text-emerald-400">{t("import.fileHint")}</p>
              </div>
            </button>

            {/* Hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf,text/csv,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Loading view */}
        {view === "loading" && (
          <div className="flex flex-col items-center justify-center pt-20">
            <div className="text-5xl mb-4 animate-bounce-gentle">✨</div>
            <p className="text-sm font-semibold text-emerald-600">{t("import.analyzing")}</p>
            <div className="mt-4 w-32 h-1.5 rounded-full bg-emerald-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-400 animate-pulse" style={{ width: "70%" }} />
            </div>
          </div>
        )}

        {/* Preview view */}
        {view === "preview" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-emerald-600">
                {t("import.preview")} ({items.length})
              </p>
              <button
                onClick={() => { setView("choose"); setItems([]); }}
                className="text-xs text-emerald-400 hover:text-emerald-600"
              >
                ← {t("import.chooseFile")}
              </button>
            </div>

            {/* Owner selector */}
            <div className="flex items-center gap-3 bg-white/80 rounded-2xl p-3.5 border border-emerald-200/50 shadow-sm">
              <span className="text-xs text-emerald-600 font-semibold whitespace-nowrap">👤 {t("import.owner")}:</span>
              <div className="flex gap-2 flex-1">
                {memberNames.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setOwner(m.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                      owner === m.key ? "bg-emerald-500 text-white shadow-sm" : "bg-emerald-50 text-emerald-500 hover:bg-emerald-100"
                    }`}
                  >
                    <MiniAvatar name={m.key} size={22} showEquipBadge={false} />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              // Group items by category for section headers
              const grouped = items.reduce((acc, item, idx) => {
                const key = item.category;
                if (!acc[key]) acc[key] = [];
                acc[key].push({ item, idx });
                return acc;
              }, {} as Record<string, { item: ParsedTransaction; idx: number }[]>);

              const categoryLabels: Record<string, string> = {
                casa: "🏠 Casa",
                compras: "🛒 Compras",
                restaurantes: "🍜 Restaurantes",
                transporte: "🚗 Transporte",
                lazer: "🎉 Lazer",
                saude: "💊 Saúde",
                outros: "🌸 Outros",
              };

              return Object.entries(grouped).map(([category, entries]) => (
                <div key={category} className="mb-3">
                  <div className="flex items-center gap-2 mt-3 mb-2 px-1">
                    <span className="text-xs font-bold text-emerald-600">{categoryLabels[category] || category}</span>
                    <span className="text-[10px] text-emerald-300 font-medium">({entries.length})</span>
                    <div className="flex-1 h-px bg-emerald-200/60" />
                    <span className="text-[10px] font-semibold text-emerald-500">
                      {entries.reduce((s, e) => s + e.item.amount, 0).toFixed(0)}€
                    </span>
                  </div>
                  {entries.map(({ item, idx }) => {
              const dup = isDuplicate(item, idx);
              const invalid = !isImportable(item);
              return (
              <div
                key={idx}
                className={`rounded-2xl p-3 mb-2 border shadow-sm space-y-2 ${
                  dup || invalid ? "bg-amber-50/80 border-amber-200/60 opacity-60"
                  : item.type === "expense" ? "bg-red-50/40 border-red-100/50"
                  : "bg-green-50/40 border-green-100/50"
                }`}
              >
                {dup && (
                  <div className="text-[10px] font-semibold text-amber-500 -mb-1">⚠️ {t("import.duplicate")}</div>
                )}
                {invalid && !dup && (
                  <div className="text-[10px] font-semibold text-amber-500 -mb-1">⚠️ {t("import.error")}</div>
                )}
                <div className="flex items-center gap-2">
                  {/* Type toggle */}
                  <button
                    onClick={() => toggleType(idx)}
                    className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95 ${
                      item.type === "expense"
                        ? "bg-red-100 text-red-500"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {item.type === "expense" ? "💸" : "💵"}
                  </button>

                  {/* Description */}
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    className="flex-1 min-w-0 text-sm text-emerald-800 bg-transparent focus:outline-none focus:bg-emerald-50/50 rounded-lg px-2 py-1 transition-all truncate"
                  />

                  {/* Amount with € */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateItem(idx, "amount", parseFloat(e.target.value) || 0)}
                      className="w-16 text-xs text-right font-semibold text-emerald-700 bg-emerald-50/50 rounded-lg px-1.5 py-1 focus:outline-none focus:bg-emerald-100/50"
                    />
                    <span className="text-[10px] text-emerald-400">€</span>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeItem(idx)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-emerald-300 hover:text-red-400 hover:bg-red-50 active:scale-90 transition-all text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Category + date row */}
                <div className="flex items-center gap-1 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateItem(idx, "category", cat.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] transition-all active:scale-90 ${
                        item.category === cat.id ? "bg-emerald-200 ring-1 ring-emerald-300 scale-110" : "bg-emerald-50/80"
                      }`}
                    >
                      {cat.emoji}
                    </button>
                  ))}
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateItem(idx, "date", e.target.value)}
                    className="ml-auto text-[10px] text-emerald-500 bg-emerald-50/80 rounded-lg px-2 py-1 focus:outline-none"
                  />
                </div>
              </div>
              );
            })}
                </div>
              ));
            })()}

            {items.length > 0 && (
              <button
                onClick={handleConfirm}
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-all"
              >
                {t("import.confirm")} ({items.filter((item, index) => isImportable(item) && !isDuplicate(item, index)).length})
              </button>
            )}
          </div>
        )}

        {/* Done view */}
        {view === "done" && (
          <div className="flex flex-col items-center justify-center pt-20">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-sm font-semibold text-emerald-600">
              {t("import.added")} ({importedCount})
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-2xl bg-emerald-100 text-emerald-600 font-semibold text-sm active:scale-95 transition-all"
            >
              ✕ {t("messages.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
