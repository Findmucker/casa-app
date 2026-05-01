"use client";

import { useState, useMemo } from "react";
import { useCollection, type ExpenseItem } from "@/lib/hooks";

type Payer = "eduardo" | "moniquinha" | "ambos";

const EXPENSE_CATEGORIES = [
  { id: "casa", emoji: "🏠", label: "Casa" },
  { id: "compras", emoji: "🛒", label: "Compras" },
  { id: "restaurantes", emoji: "🍽️", label: "Restaurantes" },
  { id: "transporte", emoji: "🚗", label: "Transporte" },
  { id: "lazer", emoji: "🎉", label: "Lazer" },
  { id: "saude", emoji: "🏥", label: "Saúde" },
  { id: "outros", emoji: "📦", label: "Outros" },
];

const PAYER_CONFIG: Record<Payer, { label: string; emoji: string }> = {
  eduardo: { label: "Eduardo", emoji: "👨" },
  moniquinha: { label: "Moniquinha", emoji: "👩" },
  ambos: { label: "Ambos", emoji: "👫" },
};

export default function ExpenseList() {
  const { items, loading, add, remove } = useCollection<ExpenseItem>("expenses", "createdAt");
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("compras");
  const [newPayer, setNewPayer] = useState<Payer>("ambos");
  const [showAdd, setShowAdd] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthItems = useMemo(() => {
    return items.filter((i) => i.date?.startsWith(viewMonth));
  }, [items, viewMonth]);

  const totalMonth = useMemo(() => monthItems.reduce((s, i) => s + i.amount, 0), [monthItems]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthItems.forEach((i) => {
      map[i.category] = (map[i.category] || 0) + i.amount;
    });
    return map;
  }, [monthItems]);

  const byPayer = useMemo(() => {
    const map: Record<string, number> = { eduardo: 0, moniquinha: 0, ambos: 0 };
    monthItems.forEach((i) => {
      map[i.paidBy] = (map[i.paidBy] || 0) + i.amount;
    });
    return map;
  }, [monthItems]);

  const handleAdd = async () => {
    const name = newName.trim();
    const amount = parseFloat(newAmount);
    if (!name || !amount) return;
    await add({
      name,
      amount,
      category: newCategory,
      paidBy: newPayer,
      date: new Date().toISOString().split("T")[0],
    } as Omit<ExpenseItem, "id">);
    setNewName("");
    setNewAmount("");
    setShowAdd(false);
  };

  const changeMonth = (delta: number) => {
    const [y, m] = viewMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthLabel = useMemo(() => {
    const [y, m] = viewMonth.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  }, [viewMonth]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-emerald-100/40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-emerald-600">💰 Gastinhos</h2>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white flex items-center justify-center text-lg active:scale-90 transition-all shadow-sm"
          >
            +
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => changeMonth(-1)} className="text-emerald-400 px-2 py-1 active:scale-90">←</button>
          <span className="text-sm font-semibold text-emerald-700 capitalize">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="text-emerald-400 px-2 py-1 active:scale-90">→</button>
        </div>

        {/* Total */}
        <div className="mt-2 text-center">
          <span className="text-2xl font-bold text-emerald-600">{totalMonth.toFixed(2)}€</span>
          <p className="text-[11px] text-emerald-400">total este mês</p>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="mt-3 space-y-2 animate-expand">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="O quê..."
                className="flex-1 rounded-2xl border border-emerald-200/60 bg-white/80 px-4 py-2.5 text-sm text-emerald-800 placeholder-emerald-300 focus:outline-none focus:border-emerald-300"
                autoFocus
              />
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="€"
                className="w-20 rounded-2xl border border-emerald-200/60 bg-white/80 px-3 py-2.5 text-sm text-emerald-800 placeholder-emerald-300 focus:outline-none focus:border-emerald-300"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setNewCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                    newCategory === cat.id ? "bg-emerald-200 text-emerald-700" : "bg-emerald-50 text-emerald-500"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(["ambos", "eduardo", "moniquinha"] as Payer[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setNewPayer(p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                    newPayer === p ? "bg-emerald-200 text-emerald-700" : "bg-emerald-50 text-emerald-500"
                  }`}
                >
                  {PAYER_CONFIG[p].emoji} {PAYER_CONFIG[p].label}
                </button>
              ))}
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newAmount}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-30"
            >
              Adicionar gasto
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="text-center text-emerald-300 py-12 animate-pulse-soft">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-sm">A carregar...</p>
          </div>
        )}

        {/* Summary by category */}
        {!loading && monthItems.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/30 shadow-sm">
            <p className="text-xs font-semibold text-emerald-600 mb-3">Por categoria</p>
            <div className="space-y-2">
              {EXPENSE_CATEGORIES.filter((c) => byCategory[c.id]).map((cat) => {
                const amount = byCategory[cat.id] || 0;
                const pct = totalMonth > 0 ? (amount / totalMonth) * 100 : 0;
                return (
                  <div key={cat.id} className="flex items-center gap-2">
                    <span className="text-sm w-6">{cat.emoji}</span>
                    <span className="text-xs text-emerald-700 w-24 truncate">{cat.label}</span>
                    <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-300 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 w-16 text-right">{amount.toFixed(0)}€</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary by payer */}
        {!loading && monthItems.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/30 shadow-sm">
            <p className="text-xs font-semibold text-emerald-600 mb-3">Quem pagou</p>
            <div className="flex gap-3">
              {(["eduardo", "moniquinha", "ambos"] as Payer[]).map((p) => (
                <div key={p} className="flex-1 text-center">
                  <div className="text-lg">{PAYER_CONFIG[p].emoji}</div>
                  <p className="text-sm font-bold text-emerald-700">{(byPayer[p] || 0).toFixed(0)}€</p>
                  <p className="text-[10px] text-emerald-400">{PAYER_CONFIG[p].label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent expenses */}
        <div className="space-y-2">
          {monthItems.map((item) => {
            const cat = EXPENSE_CATEGORIES.find((c) => c.id === item.category);
            return (
              <div
                key={item.id}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-emerald-100/30 flex items-center gap-3"
              >
                <span className="text-lg">{cat?.emoji || "📦"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">{item.name}</p>
                  <p className="text-[11px] text-emerald-400">{item.date} • {PAYER_CONFIG[item.paidBy]?.label}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">{item.amount.toFixed(2)}€</span>
                <button
                  onClick={() => remove(item.id)}
                  className="w-7 h-7 flex items-center justify-center text-emerald-300 hover:text-red-400 transition-all active:scale-90 text-xs"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {!loading && monthItems.length === 0 && (
          <div className="text-center text-emerald-300 py-12">
            <div className="text-5xl mb-3 animate-float">💰</div>
            <p className="text-sm">Nenhum gasto este mês!</p>
          </div>
        )}
      </div>
    </div>
  );
}
