"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useCollection, type ShoppingItem } from "@/lib/hooks";
import AutocompleteInput from "./AutocompleteInput";
import EventList from "./EventList";

const COMMON_SHOPPING = [
  "Leite", "Ovos", "Pão", "Manteiga", "Queijo", "Fiambre", "Iogurtes",
  "Arroz", "Massa", "Azeite", "Sal", "Açúcar", "Café", "Chá",
  "Frango", "Carne picada", "Salmão", "Atum", "Batatas", "Cebolas",
  "Alho", "Tomates", "Alface", "Cenouras", "Bananas", "Maçãs", "Laranjas",
  "Papel higiénico", "Detergente", "Sabonete", "Champô", "Pasta de dentes",
  "Água", "Sumo", "Cerveja", "Vinho", "Bolachas", "Cereais", "Chocolate",
];

export default function ShoppingList() {
  const { items, loading, add, update, remove } =
    useCollection<ShoppingItem>("shopping");
  const [newItem, setNewItem] = useState("");
  const [newUrgent, setNewUrgent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [celebrating, setCelebrating] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const fromHistory = items.map((i) => i.name);
    const combined = [...new Set([...fromHistory, ...COMMON_SHOPPING])];
    return combined;
  }, [items]);

  const handleCheck = useCallback(async (item: ShoppingItem) => {
    if (!item.done) {
      setCelebrating(item.id);
      setTimeout(() => setCelebrating(null), 600);
    }
    await update(item.id, { done: !item.done });
  }, [update]);

  const handleAdd = async () => {
    const name = newItem.trim();
    if (!name) return;
    await add({ name, addedBy: "", done: false, urgent: newUrgent } as Omit<ShoppingItem, "id">);
    setNewItem("");
    setNewUrgent(false);
    inputRef.current?.focus();
  };

  // Split into urgent undone, normal undone, done
  const undone = items.filter((i) => !i.done);
  const urgentItems = undone.filter((i) => i.urgent);
  const normalItems = undone.filter((i) => !i.urgent);
  const done = items.filter((i) => i.done);

  const ItemRow = ({ item, isDone }: { item: ShoppingItem; isDone: boolean }) => (
    <div
      className={`flex items-center gap-3 rounded-2xl p-4 transition-all ${
        isDone
          ? "bg-pink-50/40"
          : item.urgent
          ? "bg-gradient-to-r from-red-50/80 to-pink-50/60 border border-red-200/40 shadow-sm shadow-red-100/30"
          : "bg-white/70 backdrop-blur-sm border border-pink-100/30 shadow-sm shadow-pink-100/30 hover:shadow-md"
      }`}
    >
      {/* Check/uncheck */}
      <div className="relative">
        <button
          onClick={() => handleCheck(item)}
          className={`h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm transition-all active:scale-90 ${
            isDone
              ? "bg-gradient-to-r from-pink-300 to-rose-300 text-white shadow-sm shadow-pink-200/50"
              : item.urgent
              ? "border-2 border-red-300 hover:bg-red-100"
              : "border-2 border-pink-300 hover:bg-pink-100 hover:border-pink-400"
          } ${celebrating === item.id ? "animate-celebrate" : ""}`}
        >
          {isDone ? "\u2713" : ""}
        </button>
        {celebrating === item.id && (
          <div className="absolute inset-0 flex items-center justify-center confetti-burst pointer-events-none">
            <span className="absolute text-xs">💕</span>
            <span className="absolute text-xs">✨</span>
            <span className="absolute text-xs">💗</span>
            <span className="absolute text-xs">🩷</span>
          </div>
        )}
      </div>

      {/* Name */}
      <span className={`flex-1 text-base ${
        isDone ? "text-pink-300 line-through" : "text-rose-800"
      }`}>
        {item.urgent && !isDone && (
          <span className="text-xs mr-1.5">🔥</span>
        )}
        {item.name}
      </span>

      {/* Urgent toggle (only for undone) */}
      {!isDone && (
        <button
          onClick={() => update(item.id, { urgent: !item.urgent })}
          className={`text-xs px-2 py-1 rounded-full transition-all active:scale-95 ${
            item.urgent
              ? "bg-red-100 text-red-500"
              : "bg-pink-50 text-pink-300 hover:text-pink-500"
          }`}
        >
          {item.urgent ? "urgente" : "normal"}
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => remove(item.id)}
        className="text-pink-200 hover:text-red-400 transition-colors text-sm"
      >
        &#10005;
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Add form */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-pink-100/40 space-y-2">
        <div className="flex gap-2">
          <AutocompleteInput
            inputRef={inputRef}
            value={newItem}
            onChange={setNewItem}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="O que falta comprar?"
            suggestions={suggestions}
            className="flex-1 rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-base text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50 transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!newItem.trim()}
            className="rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-5 py-3 text-white font-semibold hover:from-pink-500 hover:to-rose-500 active:scale-95 transition-all disabled:opacity-30 shadow-sm shadow-pink-200/50"
          >
            +
          </button>
        </div>
        {/* Urgent toggle for new items */}
        <button
          onClick={() => setNewUrgent(!newUrgent)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all active:scale-95 ${
            newUrgent
              ? "bg-red-100 text-red-500 shadow-sm"
              : "bg-pink-50/80 text-pink-400 hover:bg-pink-100"
          }`}
        >
          <span>{newUrgent ? "🔥" : "🕊️"}</span>
          <span>{newUrgent ? "Urgente — comprar hoje!" : "Normal — pode esperar"}</span>
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {loading && (
          <div className="text-center text-pink-300 py-12 animate-pulse-soft">
            <div className="text-3xl mb-2">🧺</div>
            <p className="text-sm">A carregar...</p>
          </div>
        )}

        {!loading && undone.length === 0 && done.length === 0 && (
          <div className="text-center text-pink-300 py-12">
            <div className="text-5xl mb-3 animate-float">🧺</div>
            <p className="text-sm">Nada para comprar!</p>
            <p className="text-xs text-pink-200 mt-1">Adiciona algo em cima</p>
          </div>
        )}

        {/* Urgent section */}
        {urgentItems.length > 0 && (
          <>
            <div className="text-xs font-semibold text-red-400 uppercase tracking-wider pb-1 flex items-center gap-2">
              <span>🔥 Urgente</span>
              <span className="bg-red-100 text-red-500 px-2 py-0.5 rounded-full text-[10px]">
                {urgentItems.length}
              </span>
            </div>
            {urgentItems.map((item) => (
              <ItemRow key={item.id} item={item} isDone={false} />
            ))}
          </>
        )}

        {/* Normal section */}
        {normalItems.length > 0 && (
          <>
            {urgentItems.length > 0 && (
              <div className="text-xs font-semibold text-pink-300 uppercase tracking-wider pt-3 pb-1 flex items-center gap-2">
                <span>🕊️ Quando der</span>
                <span className="bg-pink-100 text-pink-400 px-2 py-0.5 rounded-full text-[10px]">
                  {normalItems.length}
                </span>
              </div>
            )}
            {normalItems.map((item) => (
              <ItemRow key={item.id} item={item} isDone={false} />
            ))}
          </>
        )}

        {/* Done section */}
        {done.length > 0 && (
          <>
            <div className="text-xs font-semibold text-pink-300 uppercase tracking-wider pt-4 pb-1 flex items-center gap-2">
              <span>Comprado</span>
              <span className="bg-pink-100 text-pink-400 px-2 py-0.5 rounded-full text-[10px]">
                {done.length}
              </span>
            </div>
            {done.map((item) => (
              <ItemRow key={item.id} item={item} isDone={true} />
            ))}
          </>
        )}

        {/* Events section */}
        <div className="pt-6 border-t border-pink-100/40 mt-4">
          <EventList />
        </div>
      </div>
    </div>
  );
}
