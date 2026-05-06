"use client";

import { useState, useRef } from "react";
import { useT } from "@/lib/i18n";
import { parseCSV, type ParsedTransaction } from "@/lib/bankParsers";

interface ImportPanelProps {
  onClose: () => void;
  onImport: (items: ParsedTransaction[]) => Promise<void>;
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

export default function ImportPanel({ onClose, onImport }: ImportPanelProps) {
  const { t } = useT();
  const [view, setView] = useState<ViewState>("choose");
  const [items, setItems] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        const res = await fetch("/api/parse-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
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
      } catch {
        setError(t("import.error"));
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
      await onImport(items);
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

            {items.map((item, idx) => (
              <div
                key={idx}
                className="bg-white/80 rounded-2xl p-3 border border-emerald-100/40 shadow-sm space-y-2"
              >
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
            ))}

            {items.length > 0 && (
              <button
                onClick={handleConfirm}
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-all"
              >
                {t("import.confirm")} ({items.length})
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
