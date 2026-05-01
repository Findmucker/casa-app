"use client";

import { useState, useMemo } from "react";
import { useCollection, type ShoppingItem, type SmallPriorityItem, type BigPriorityItem, type HabitItem, type ExpenseItem } from "@/lib/hooks";

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
  const [query, setQuery] = useState("");
  const { items: shopping } = useCollection<ShoppingItem>("shopping", "createdAt");
  const { items: coisinhas } = useCollection<SmallPriorityItem>("priorities_small", "order");
  const { items: projects } = useCollection<BigPriorityItem>("priorities_big", "order");
  const { items: habits } = useCollection<HabitItem>("habits", "createdAt");
  const { items: expenses } = useCollection<ExpenseItem>("expenses", "createdAt");

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const res: SearchResult[] = [];

    shopping.forEach((i) => {
      if (i.name.toLowerCase().includes(q)) {
        res.push({ name: i.name, tab: "shopping", tabLabel: "Comprinhas", emoji: "🛒", detail: i.done ? "✓ Feito" : "Pendente" });
      }
    });
    coisinhas.forEach((i) => {
      if (i.name.toLowerCase().includes(q)) {
        res.push({ name: i.name, tab: "small", tabLabel: "Coisinhas", emoji: "🪴", detail: i.done ? "✓ Feito" : "Pendente" });
      }
    });
    projects.forEach((i) => {
      if (i.name.toLowerCase().includes(q)) {
        res.push({ name: i.name, tab: "big", tabLabel: "Projetinhos", emoji: "🏠", detail: i.status });
      }
    });
    habits.forEach((i) => {
      if (i.name.toLowerCase().includes(q)) {
        res.push({ name: i.name, tab: "habits", tabLabel: "Rotinazinhas", emoji: "💊", detail: `🔥 ${i.streak} dias` });
      }
    });
    expenses.forEach((i) => {
      if (i.name.toLowerCase().includes(q)) {
        res.push({ name: i.name, tab: "expenses", tabLabel: "Gastinhos", emoji: "💰", detail: `${i.amount}€` });
      }
    });

    return res.slice(0, 20);
  }, [query, shopping, coisinhas, projects, habits, expenses]);

  return (
    <div className="absolute inset-0 bg-white/98 backdrop-blur-md z-50 flex flex-col animate-fade-in-up">
      {/* Search input */}
      <div className="p-4 border-b border-pink-100/40">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar em tudo..."
            className="flex-1 text-base text-rose-800 placeholder-pink-300 focus:outline-none bg-transparent"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-sm text-pink-400 hover:text-pink-600 px-2 py-1 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {query.length < 2 && (
          <p className="text-center text-pink-300 text-sm py-8">Escreve pelo menos 2 letras...</p>
        )}
        {query.length >= 2 && results.length === 0 && (
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
              <p className="text-[11px] text-pink-400">{r.tabLabel} • {r.detail}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
