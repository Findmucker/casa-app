"use client";

import { useState, useCallback } from "react";
import {
  useCollection,
  type SmallPriorityItem,
  type BigPriorityItem,
} from "@/lib/hooks";

type PriorityItem = SmallPriorityItem | BigPriorityItem;

interface PriorityListProps {
  collectionName: "priorities_small" | "priorities_big";
  type: "small" | "big";
}

const STATUS_LABELS = {
  pendente: { label: "Pendente", color: "bg-purple-100/80 text-purple-500", emoji: "&#128156;" },
  "em progresso": { label: "A fazer", color: "bg-blue-100/80 text-blue-400", emoji: "&#128296;" },
  concluido: { label: "Feito!", color: "bg-green-100/80 text-green-500", emoji: "&#10024;" },
};

export default function PriorityList({ collectionName, type }: PriorityListProps) {
  const { items, loading, add, update, remove } = useCollection<PriorityItem>(
    collectionName,
    "order"
  );
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [celebrating, setCelebrating] = useState<string | null>(null);

  const handleToggleDone = useCallback(async (item: SmallPriorityItem) => {
    if (!item.done) {
      setCelebrating(item.id);
      setTimeout(() => setCelebrating(null), 600);
    }
    await update(item.id, { done: !item.done });
  }, [update]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;

    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) : 0;

    if (type === "small") {
      await add({
        name,
        done: false,
        order: maxOrder + 1,
        ...(newPrice ? { price: parseFloat(newPrice) } : {}),
      } as Omit<SmallPriorityItem, "id">);
    } else {
      await add({
        name,
        status: "pendente",
        order: maxOrder + 1,
        notes: "",
      } as Omit<BigPriorityItem, "id">);
    }
    setNewName("");
    setNewPrice("");
  };

  const moveItem = async (item: PriorityItem, direction: "up" | "down") => {
    const idx = items.findIndex((i) => i.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const other = items[swapIdx];
    await update(item.id, { order: other.order });
    await update(other.id, { order: item.order });
  };

  const cycleStatus = async (item: BigPriorityItem) => {
    const cycle: Array<"pendente" | "em progresso" | "concluido"> = [
      "pendente",
      "em progresso",
      "concluido",
    ];
    const next = cycle[(cycle.indexOf(item.status) + 1) % 3];
    await update(item.id, { status: next });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add form */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-pink-100/40 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={
              type === "small"
                ? "Coisinha para comprar..."
                : "Projeto novo..."
            }
            className="flex-1 rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-base text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50 transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-5 py-3 text-white font-semibold hover:from-pink-500 hover:to-rose-500 active:scale-95 transition-all disabled:opacity-30 shadow-sm shadow-pink-200/50"
          >
            +
          </button>
        </div>
        {type === "small" && (
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Preço estimado (opcional)"
            className="w-full rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-2 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50 transition-all"
          />
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {loading && (
          <div className="text-center text-pink-300 py-12 animate-pulse-soft">
            <div className="text-3xl mb-2">{type === "small" ? "🪴" : "🏡"}</div>
            <p className="text-sm">A carregar...</p>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center text-pink-300 py-12">
            <div className="text-5xl mb-3 animate-float">
              {type === "small" ? "🪴" : "🏡"}
            </div>
            <p className="text-sm">
              {type === "small" ? "Nenhuma coisinha por agora!" : "Nenhum projeto ainda!"}
            </p>
            <p className="text-xs text-pink-200 mt-1">Adiciona algo em cima</p>
          </div>
        )}

        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm shadow-pink-100/30 border border-pink-100/30 transition-all hover:shadow-md hover:shadow-pink-100/30 ${
              type === "big" && "status" in item && item.status === "concluido"
                ? "opacity-50"
                : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Priority number */}
              <span className="text-lg font-bold text-pink-200 w-6 text-center">
                {idx + 1}
              </span>

              {/* Move arrows */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveItem(item, "up")}
                  disabled={idx === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-pink-50 text-sm text-pink-400 hover:bg-pink-100 hover:text-pink-600 disabled:opacity-20 active:scale-90 transition-all"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveItem(item, "down")}
                  disabled={idx === items.length - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-pink-50 text-sm text-pink-400 hover:bg-pink-100 hover:text-pink-600 disabled:opacity-20 active:scale-90 transition-all"
                >
                  ▼
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {type === "small" ? (
                    <div className="relative">
                      <button
                        onClick={() => handleToggleDone(item as SmallPriorityItem)}
                        className={`h-8 w-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-sm transition-all active:scale-90 ${
                          (item as SmallPriorityItem).done
                            ? "bg-gradient-to-r from-pink-300 to-rose-300 border-pink-300 text-white shadow-sm shadow-pink-200/50"
                            : "border-pink-300 hover:bg-pink-100"
                        } ${celebrating === item.id ? "animate-celebrate" : ""}`}
                      >
                        {(item as SmallPriorityItem).done ? "✓" : ""}
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
                  ) : (
                    <button
                      onClick={() => cycleStatus(item as BigPriorityItem)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                        STATUS_LABELS[(item as BigPriorityItem).status].color
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: `${STATUS_LABELS[(item as BigPriorityItem).status].emoji} ${STATUS_LABELS[(item as BigPriorityItem).status].label}`
                      }}
                    />
                  )}
                  <span
                    className={`text-base ${
                      type === "big" ? "break-words" : "truncate"
                    } ${
                      type === "small" && (item as SmallPriorityItem).done
                        ? "line-through text-pink-300"
                        : "text-rose-800"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                {type === "small" && (item as SmallPriorityItem).price && (
                  <span className="text-xs text-pink-400 ml-8">
                    ~{(item as SmallPriorityItem).price}&euro;
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {type === "big" && (
                  <button
                    onClick={() => {
                      if (editingNotes === item.id) {
                        update(item.id, { notes: notesText });
                        setEditingNotes(null);
                      } else {
                        setEditingNotes(item.id);
                        setNotesText((item as BigPriorityItem).notes || "");
                      }
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-pink-50 text-pink-400 hover:bg-pink-100 hover:text-pink-600 transition-all active:scale-90 text-base"
                  >
                    📝
                  </button>
                )}
                <button
                  onClick={() => remove(item.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-pink-50 text-pink-300 hover:bg-red-50 hover:text-red-400 transition-all active:scale-90 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Notes editor for big items */}
            {type === "big" && editingNotes === item.id && (
              <div className="mt-3 ml-8">
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Notas sobre este projeto..."
                  className="w-full rounded-xl border border-pink-200/60 bg-white/80 px-3 py-2 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 resize-none transition-all"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      update(item.id, { notes: notesText });
                      setEditingNotes(null);
                    }}
                    className="text-xs bg-gradient-to-r from-pink-400 to-rose-400 text-white px-4 py-1.5 rounded-xl shadow-sm shadow-pink-200/50 active:scale-95 transition-all"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingNotes(null)}
                    className="text-xs text-pink-400 px-3 py-1.5 hover:text-pink-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Show notes if exists and not editing */}
            {type === "big" &&
              editingNotes !== item.id &&
              (item as BigPriorityItem).notes && (
                <p className="mt-2 ml-8 text-xs text-pink-400/70 italic">
                  {(item as BigPriorityItem).notes}
                </p>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
