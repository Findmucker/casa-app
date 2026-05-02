"use client";

import { useState, useMemo } from "react";
import {
  useLazyCollection,
  type ShoppingItem,
  type SmallPriorityItem,
  type BigPriorityItem,
  type HabitItem,
  type ExpenseItem,
} from "@/lib/hooks";
import { useT } from "@/lib/i18n";

interface SearchOverlayProps {
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

interface SearchResult {
  name: string;
  tab: string;
  tabLabel: string;
  emoji: string;
  detail?: string;
}

export default function SearchOverlay({ onClose, onNavigate }: SearchOverlayProps) {
  const { t } = useT();
  const [query, setQuery] = useState("");

  // Only open listeners when user has typed 2+ chars
  const enabled = query.length >= 2;

  const { items: shopping } = useLazyCollection<ShoppingItem>("shopping", "createdAt", enabled);
  const { items: coisinhas } = useLazyCollection<SmallPriorityItem>("priorities_small", "order", enabled);
  const { items: projects } = useLazyCollection<BigPriorityItem>("priorities_big", "order", enabled);
  const { items: habits } = useLazyCollection<HabitItem>("habits", "createdAt", enabled);
  const { items: expenses } = useLazyCollection<ExpenseItem>("expenses", "createdAt", enabled);

  const results = useMemo(() => {
    if (!enabled) return [];
    const q = query.toLowerCase();
    const res: SearchResult[] = [];

    shopping.forEach((i) => {
      if (i.name.toLowerCase().includes(q)) {
        res.push({ name: i.name, tab: "shopping", tabLabel: "Comprinhas", emoji: "\u{1F6D2}", detail: i.done ? "\u2713 Feito" : "Pendente" });
      }
    });
    coisinhas.forEach((i) => {
      if (i.name.toLowerCase().includes(q)) {
        res.push({ name: i.name, tab: "small", tabLabel: "Coisinhas", emoji: "\u{1FAB4}", detail: i.done ? "\u2713 Feito" : "Pendente" });
      }
    });
    projects.forEach((i) => {
      if (i.name.toLowerCase().includes(q)) {
        res.push({ name: i.name, tab: "big", tabLabel: "Projetinhos", emoji: "\u{1F3E0}", detail: i.status });
      }
    });
    habits.forEach((i) => {
      if (i.name.toLowerCase().includes(q)) {
        res.push({ name: i.name, tab: "habits", tabLabel: "Rotinazinhas", emoji: "\u{1F48A}", detail: `\u{1F525} ${i.streak} dias` });
      }
    });
    expenses.forEach((i) => {
      if (i.name.toLowerCase().includes(q)) {
        res.push({ name: i.name, tab: "expenses", tabLabel: "Gastinhos", emoji: "\u{1F4B0}", detail: `${i.amount}\u20AC` });
      }
    });

    return res.slice(0, 20);
  }, [query, enabled, shopping, coisinhas, projects, habits, expenses]);

  return (
    <div className="absolute inset-0 bg-white/98 backdrop-blur-md z-50 flex flex-col animate-fade-in-up">
      {/* Search input */}
      <div className="p-4 border-b border-pink-100/40">
        <div className="flex items-center gap-2">
          <span className="text-lg">{"\u{1F50D}"}</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            className="flex-1 text-base text-rose-800 placeholder-pink-300 focus:outline-none bg-transparent"
            autoFocus
          />
          <button
            onClick={onClose}
            aria-label="Fechar pesquisa"
            className="text-sm text-pink-400 hover:text-pink-600 px-2 py-1 transition-colors"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!enabled && (
          <p className="text-center text-pink-300 text-sm py-8">Escreve pelo menos 2 letras...</p>
        )}
        {enabled && results.length === 0 && (
          <p className="text-center text-pink-300 text-sm py-8">Nenhum resultado para &ldquo;{query}&rdquo;</p>
        )}
        {results.map((r, i) => (
          <button
            key={i}
            onClick={() => { onNavigate(r.tab); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/70 border border-pink-100/30 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            <span className="text-lg">{r.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-rose-800 truncate">{r.name}</p>
              <p className="text-[11px] text-pink-400">{r.tabLabel} &bull; {r.detail}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
