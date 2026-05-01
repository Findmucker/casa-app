"use client";

import { useMemo } from "react";
import { useCollection, type ShoppingItem, type SmallPriorityItem, type BigPriorityItem } from "@/lib/hooks";

interface HistoryPanelProps {
  onClose: () => void;
}

export default function HistoryPanel({ onClose }: HistoryPanelProps) {
  const { items: shopping } = useCollection<ShoppingItem>("shopping", "createdAt");
  const { items: coisinhas } = useCollection<SmallPriorityItem>("priorities_small", "order");
  const { items: projects } = useCollection<BigPriorityItem>("priorities_big", "order");

  const completedItems = useMemo(() => {
    const all: { name: string; type: string; emoji: string; date?: string }[] = [];

    shopping.filter((s) => s.done).forEach((s) => {
      all.push({ name: s.name, type: "Comprinhas", emoji: "🛒", date: s.completedAt });
    });
    coisinhas.filter((c) => c.done).forEach((c) => {
      all.push({ name: c.name, type: "Coisinhas", emoji: "🪴", date: c.completedAt });
    });
    projects.filter((p) => p.status === "concluido").forEach((p) => {
      all.push({ name: p.name, type: "Projetinhos", emoji: "🏠", date: p.completedAt });
    });

    // Sort by date desc
    all.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return all;
  }, [shopping, coisinhas, projects]);

  const stats = useMemo(() => ({
    shopping: shopping.filter((s) => s.done).length,
    coisinhas: coisinhas.filter((c) => c.done).length,
    projects: projects.filter((p) => p.status === "concluido").length,
    total: completedItems.length,
  }), [shopping, coisinhas, projects, completedItems]);

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-pink-50/98 via-rose-50/98 to-purple-50/98 backdrop-blur-md z-50 flex flex-col animate-fade-in-up">
      <div className="p-4 border-b border-pink-100/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-rose-500">📜 Histórico</h2>
          <button onClick={onClose} className="text-sm text-pink-400 hover:text-pink-600 transition-colors">Fechar</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 p-4">
        <div className="bg-white/60 rounded-xl p-3 text-center border border-pink-100/30">
          <p className="text-lg font-bold text-rose-600">{stats.total}</p>
          <p className="text-[9px] text-pink-400">Total</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 text-center border border-pink-100/30">
          <p className="text-lg font-bold text-rose-600">{stats.shopping}</p>
          <p className="text-[9px] text-pink-400">🛒</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 text-center border border-pink-100/30">
          <p className="text-lg font-bold text-rose-600">{stats.coisinhas}</p>
          <p className="text-[9px] text-pink-400">🪴</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 text-center border border-pink-100/30">
          <p className="text-lg font-bold text-rose-600">{stats.projects}</p>
          <p className="text-[9px] text-pink-400">🏠</p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {completedItems.slice(0, 50).map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/60 rounded-xl px-3 py-2.5 border border-pink-100/20">
            <span className="text-sm">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-rose-700 truncate">{item.name}</p>
              {item.date && <p className="text-[10px] text-pink-400">{item.date}</p>}
            </div>
            <span className="text-[10px] text-pink-300">{item.type}</span>
          </div>
        ))}
        {completedItems.length === 0 && (
          <p className="text-center text-pink-300 text-sm py-8">Nada completado ainda!</p>
        )}
      </div>
    </div>
  );
}
