"use client";

import { useState, useRef } from "react";
import { useT } from "@/lib/i18n";
import { parseCSV, parsePDFText, parsePDFRows, type ParsedTransaction } from "@/lib/bankParsers";
import { pdfToText, pdfToImage, pdfToRows } from "@/lib/pdfToImage";

interface ImportPanelProps {
  onClose: () => void;
  onImport: (items: ParsedTransaction[], owner: string) => Promise<void>;
  existingExpenses: { name: string; amount: number; date?: string }[];
  existingIncome: { name: string; amount: number; date?: string }[];
  memberNames: { key: string; label: string }[];
  currentUser: string;
}

const CATEGORIES = [
  { id: "casa", emoji: "🏠" },
  { id: "compras", emoji: "🛒" },
  { id: "restaurantes", emoji: "🍽️" },
  { id: "transporte", emoji: "🚗" },
  { id: "lazer", emoji: "🎉" },
  { id: "saude", emoji: "🏥" },
  { id: "outros", emoji: "📦" },
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
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isDuplicate = (item: ParsedTransaction) => {
    if (item.type === "expense") {
      return existingExpenses.some(e => e.name === item.description && e.amount === item.amount && e.date === item.date);
    }
    return existingIncome.some(i => i.name === item.description && i.amount === item.amount && i.date === item.date);
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

    // Image/PDF — send to Gemini via API
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      setView("loading");
      try {
        // PDF: try text extraction first (no AI needed)
        if (file.type === "application/pdf") {
          const rows = await pdfToRows(file);
          const text = rows.map(r => r.items.map(i => i.str).join(" ")).join("\n");
          // Try structured CSV parsing, then position-aware row parsing, then raw text
          const parsed = parseCSV(text);
          const results = parsed.length > 0 ? parsed : parsePDFRows(rows);
          const finalResults = results.length > 0 ? results : parsePDFText(text);
          if (finalResults.length > 0) {
            setItems(finalResults);
            setView("preview");
            return;
          }
          // Text extraction didn't yield results — fall through to AI with image
        }

        let base64: string;
        let mime: string;

        if (file.type === "application/pdf") {
          // Convert PDF to image for AI processing
          const result = await pdfToImage(file);
          base64 = result.base64;
          mime = result.mimeType;
        } else {
          // Regular image — encode as base64
          const buffer = await file.arrayBuffer();
          base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
          );
          mime = file.type;
        }

        const res = await fetch("/api/parse-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType: mime }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || t("import.error"));
          setView("choose");
          return;
        }

        const data = await res.json();
        if (!data.items || data.items.length === 0) {
          setError(t("import.noItems"));
          setView("choose");
          return;
        }
        setItems(data.items);
        setView("preview");
      } catch (err) {
        console.error("Import processing error:", err);
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
      await onImport(items, owner);
      setImportedCount(items.length);
      setView("done");
    } catch {
      setError(t("import.error"));
      setView("preview");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in-up bg-gradient-to-br from-emerald-50/98 via-teal-50/98 to-green-50/98 backdrop-blur-md">
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
              <div className="text-5xl mb-3">📥</div>
              <p className="text-sm text-emerald-500">{t("import.title")}</p>
            </div>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full p-5 rounded-[28px] bg-white/80 border border-emerald-100/40 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              <span className="text-3xl">📸</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-emerald-700">{t("import.takePhoto")}</p>
                <p className="text-xs text-emerald-400">Recibo, fatura, extrato</p>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-5 rounded-[28px] bg-white/80 border border-emerald-100/40 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              <span className="text-3xl">📄</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-emerald-700">{t("import.chooseFile")}</p>
                <p className="text-xs text-emerald-400">CSV, PDF, imagem</p>
              </div>
            </button>

            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.csv,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Loading view */}
        {view === "loading" && (
          <div className="flex flex-col items-center justify-center pt-20">
            <div className="text-5xl mb-4 animate-bounce-gentle">🤖</div>
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
                restaurantes: "🍽️ Restaurantes",
                transporte: "🚗 Transporte",
                lazer: "🎉 Lazer",
                saude: "🏥 Saúde",
                outros: "📦 Outros",
              };

              return Object.entries(grouped).map(([category, entries]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mt-2 mb-1.5">
                    <span className="text-xs font-bold text-emerald-500">{categoryLabels[category] || category}</span>
                    <span className="text-[10px] text-emerald-300">({entries.length})</span>
                    <div className="flex-1 h-px bg-emerald-100/60" />
                  </div>
                  {entries.map(({ item, idx }) => {
              const dup = isDuplicate(item);
              return (
              <div
                key={idx}
                className={`rounded-2xl p-3 border shadow-sm space-y-2 ${dup ? "bg-amber-50/80 border-amber-200/60 opacity-60" : "bg-white/80 border-emerald-100/40"}`}
              >
                {dup && (
                  <div className="text-[10px] font-semibold text-amber-500 -mb-1">⚠️ Duplicado — será ignorado</div>
                )}
                <div className="flex items-center gap-2">
                  {/* Type toggle */}
                  <button
                    onClick={() => toggleType(idx)}
                    className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95 ${
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
                    className="flex-1 text-sm text-emerald-800 bg-transparent focus:outline-none focus:bg-emerald-50 rounded-lg px-2 py-1 transition-all"
                  />

                  {/* Amount */}
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(idx, "amount", parseFloat(e.target.value) || 0)}
                    className="w-20 text-sm text-right font-semibold text-emerald-700 bg-transparent focus:outline-none focus:bg-emerald-50 rounded-lg px-2 py-1"
                  />
                  <span className="text-xs text-emerald-400">€</span>

                  {/* Delete */}
                  <button
                    onClick={() => removeItem(idx)}
                    className="w-7 h-7 flex items-center justify-center text-emerald-300 hover:text-red-400 active:scale-90 transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Category + date row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateItem(idx, "category", cat.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all active:scale-90 ${
                        item.category === cat.id ? "bg-emerald-200 scale-110" : "bg-emerald-50"
                      }`}
                    >
                      {cat.emoji}
                    </button>
                  ))}
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => updateItem(idx, "date", e.target.value)}
                    className="ml-auto text-[11px] text-emerald-500 bg-emerald-50 rounded-lg px-2 py-1 focus:outline-none"
                  />
                </div>
              </div>
              );
            })}
                </div>
              ));
            })()}

            {items.length > 0 && (
              <div className="mt-4 space-y-3">
                {/* Owner selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-500 font-medium">👤 Documento de:</span>
                  <div className="flex gap-1.5">
                    {memberNames.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setOwner(m.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                          owner === m.key ? "bg-emerald-200 text-emerald-700" : "bg-emerald-50 text-emerald-400"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-all"
                >
                  {t("import.confirm")} ({items.filter(i => !isDuplicate(i)).length})
                </button>
              </div>
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
