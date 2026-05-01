"use client";

import { useState, useCallback, useMemo } from "react";
import {
  useCollection,
  type SmallPriorityItem,
  type BigPriorityItem,
} from "@/lib/hooks";
import {
  COISINHAS_CATEGORIES,
  COISINHAS_CATEGORY_ORDER,
  guessCategory,
  getAllCategoryNames,
} from "@/lib/categories";
import AutocompleteInput from "./AutocompleteInput";

type PriorityItem = SmallPriorityItem | BigPriorityItem;

type Assignee = "eduardo" | "moniquinha" | "ambos";
type FilterTab = "todos" | Assignee;

const ASSIGNEE_CONFIG: Record<Assignee, { label: string; emoji: string }> = {
  eduardo: { label: "Eduardo", emoji: "👨" },
  moniquinha: { label: "Moniquinha", emoji: "👩" },
  ambos: { label: "Ambos", emoji: "👫" },
};

const ASSIGNEE_CYCLE: Assignee[] = ["ambos", "eduardo", "moniquinha"];

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "eduardo", label: "👨 Eduardo" },
  { value: "moniquinha", label: "👩 Moniquinha" },
  { value: "ambos", label: "👫 Ambos" },
];

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
  const [newAssignee, setNewAssignee] = useState<Assignee>("ambos");
  const [filterTab, setFilterTab] = useState<FilterTab>("todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [celebratingCategory, setCelebratingCategory] = useState<string | null>(null);

  const COMMON_COISINHAS = [
    "Aspirador", "Toalhas", "Cortinas", "Almofadas", "Velas", "Plantas",
    "Organizador", "Caixas", "Prateleira", "Espelho", "Tapete", "Candeeiro",
    "Molduras", "Puxadores", "Ganchos", "Cabides", "Cesto roupa",
  ];

  const nameSuggestions = useMemo(() => {
    const fromHistory = items.map((i) => i.name);
    return [...new Set([...fromHistory, ...COMMON_COISINHAS])];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (type !== "small" || filterTab === "todos") return items;
    return items.filter((item) => {
      const assignee = (item as SmallPriorityItem).assignee || "ambos";
      return assignee === filterTab;
    });
  }, [items, filterTab, type]);

  const cycleAssignee = (current: Assignee): Assignee => {
    const idx = ASSIGNEE_CYCLE.indexOf(current);
    return ASSIGNEE_CYCLE[(idx + 1) % ASSIGNEE_CYCLE.length];
  };

  const handleToggleDone = useCallback(async (item: SmallPriorityItem) => {
    if (!item.done) {
      setCelebrating(item.id);
      setTimeout(() => setCelebrating(null), 600);
      // Check if category complete
      const cat = item.category || guessCategory(item.name, COISINHAS_CATEGORIES);
      const catUndone = filteredItems.filter(
        (i) => !((i as SmallPriorityItem).done) && i.id !== item.id &&
          ((i as SmallPriorityItem).category || guessCategory(i.name, COISINHAS_CATEGORIES)) === cat
      );
      if (catUndone.length === 0) {
        setCelebratingCategory(cat);
        setTimeout(() => setCelebratingCategory(null), 1500);
      }
    }
    await update(item.id, { done: !item.done });
  }, [update, filteredItems]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;

    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) : 0;

    if (type === "small") {
      const category = guessCategory(name, COISINHAS_CATEGORIES);
      await add({
        name,
        done: false,
        order: maxOrder + 1,
        assignee: newAssignee,
        category,
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

  const startEditing = (item: PriorityItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    if (type === "small") {
      setEditPrice((item as SmallPriorityItem).price?.toString() || "");
    }
  };

  const saveEdit = async (item: PriorityItem) => {
    const name = editName.trim();
    if (!name) return;
    const updates: Record<string, unknown> = { name };
    if (type === "small") {
      updates.price = editPrice ? parseFloat(editPrice) : null;
    }
    await update(item.id, updates);
    setEditingId(null);
  };

  const moveItem = async (item: PriorityItem, direction: "up" | "down") => {
    const idx = filteredItems.findIndex((i) => i.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= filteredItems.length) return;

    const other = filteredItems[swapIdx];
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
        {/* Filter tabs (only for small/coisinhas) */}
        {type === "small" && (
          <div className="flex gap-1.5 overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterTab(tab.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                  filterTab === tab.value
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-sm shadow-pink-200/50"
                    : "bg-pink-50 text-pink-400 hover:bg-pink-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          {/* Assignee cycle button (only for small) */}
          {type === "small" && (
            <button
              onClick={() => setNewAssignee(cycleAssignee(newAssignee))}
              className="w-12 h-12 flex-shrink-0 rounded-2xl bg-pink-50 border border-pink-200/60 flex items-center justify-center text-xl transition-all active:scale-90 hover:bg-pink-100"
              title={ASSIGNEE_CONFIG[newAssignee].label}
            >
              {ASSIGNEE_CONFIG[newAssignee].emoji}
            </button>
          )}
          <AutocompleteInput
            value={newName}
            onChange={setNewName}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={
              type === "small"
                ? "Coisinha nova..."
                : "Projetinho novo..."
            }
            suggestions={nameSuggestions}
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

        {!loading && filteredItems.length === 0 && (
          <div className="text-center text-pink-300 py-12">
            <div className="text-5xl mb-3 animate-float">
              {type === "small" ? "🪴" : "🏡"}
            </div>
            <p className="text-sm">
              {type === "small" ? "Nenhuma coisinha por agora!" : "Nenhum projetinho ainda!"}
            </p>
            <p className="text-xs text-pink-200 mt-1">Adiciona algo em cima</p>
          </div>
        )}

        {/* Category progress trackers (small only) */}
        {type === "small" && !loading && filteredItems.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-3">
            {COISINHAS_CATEGORY_ORDER.map((cat) => {
              const catItems = filteredItems.filter(
                (i) => ((i as SmallPriorityItem).category || guessCategory(i.name, COISINHAS_CATEGORIES)) === cat
              );
              if (catItems.length === 0) return null;
              const catDone = catItems.filter((i) => (i as SmallPriorityItem).done).length;
              const isComplete = catDone === catItems.length;
              const isCelebrating = celebratingCategory === cat;
              return (
                <div
                  key={cat}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                    isComplete
                      ? "bg-green-100 text-green-600"
                      : "bg-pink-50 text-pink-500"
                  } ${isCelebrating ? "animate-category-complete" : ""}`}
                >
                  <span>{cat.split(" ")[0]}</span>
                  <span>{catDone}/{catItems.length}</span>
                  {isComplete && <span>✓</span>}
                </div>
              );
            })}
          </div>
        )}

        {filteredItems.map((item, idx) => (
          <div
            key={item.id}
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-sm shadow-pink-100/30 border border-pink-100/30 transition-all hover:shadow-md hover:shadow-pink-100/30 ${
              type === "big" && "status" in item && item.status === "concluido"
                ? "opacity-50"
                : ""
            } ${type === "small" && (item as SmallPriorityItem).done ? "opacity-50" : ""}`}
          >
            {/* Main row */}
            <div className="flex items-center gap-2">
              {/* Move arrows */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveItem(item, "up")}
                  disabled={idx === 0}
                  className="w-6 h-5 flex items-center justify-center text-xs text-pink-300 disabled:opacity-20 active:scale-90 rounded"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveItem(item, "down")}
                  disabled={idx === filteredItems.length - 1}
                  className="w-6 h-5 flex items-center justify-center text-xs text-pink-300 disabled:opacity-20 active:scale-90 rounded"
                >
                  ▼
                </button>
              </div>

              {/* Checkbox (small) or Status (big) */}
              {type === "small" ? (
                <div className="relative">
                  <button
                    onClick={() => handleToggleDone(item as SmallPriorityItem)}
                    className={`h-7 w-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs transition-all active:scale-90 ${
                      (item as SmallPriorityItem).done
                        ? "bg-gradient-to-r from-pink-300 to-rose-300 border-pink-300 text-white"
                        : "border-pink-300 hover:bg-pink-100"
                    } ${celebrating === item.id ? "animate-celebrate" : ""}`}
                  >
                    {(item as SmallPriorityItem).done ? "✓" : ""}
                  </button>
                  {celebrating === item.id && (
                    <div className="absolute inset-0 flex items-center justify-center confetti-burst pointer-events-none">
                      <span className="absolute text-xs">💕</span>
                      <span className="absolute text-xs">✨</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => cycleStatus(item as BigPriorityItem)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all active:scale-95 flex-shrink-0 ${
                    STATUS_LABELS[(item as BigPriorityItem).status].color
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: `${STATUS_LABELS[(item as BigPriorityItem).status].emoji} ${STATUS_LABELS[(item as BigPriorityItem).status].label}`
                  }}
                />
              )}

              {/* Name (tap to edit) */}
              <span
                onClick={() => startEditing(item)}
                className={`flex-1 text-sm cursor-pointer truncate ${
                  type === "small" && (item as SmallPriorityItem).done
                    ? "line-through text-pink-300"
                    : "text-rose-800"
                }`}
              >
                {item.name}
              </span>

              {/* Assignee badge */}
              {type === "small" && (
                <button
                  onClick={() => {
                    const current = (item as SmallPriorityItem).assignee || "ambos";
                    update(item.id, { assignee: cycleAssignee(current) });
                  }}
                  className="w-8 h-8 flex-shrink-0 rounded-full bg-pink-50 flex items-center justify-center hover:bg-pink-100 active:scale-90 transition-all text-sm"
                >
                  {ASSIGNEE_CONFIG[(item as SmallPriorityItem).assignee || "ambos"].emoji}
                </button>
              )}

              {/* Compact actions: notes + delete */}
              <button
                onClick={() => {
                  if (editingNotes === item.id) {
                    update(item.id, { notes: notesText });
                    setEditingNotes(null);
                  } else {
                    setEditingNotes(item.id);
                    setNotesText((item as BigPriorityItem).notes || (item as SmallPriorityItem).notes || "");
                  }
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all active:scale-90 ${
                  ((item as SmallPriorityItem).notes || (item as BigPriorityItem).notes)
                    ? "bg-pink-100 text-pink-500"
                    : "text-pink-300 hover:text-pink-500"
                }`}
              >
                📝
              </button>
              <button
                onClick={() => remove(item.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-pink-300 hover:text-red-400 transition-all active:scale-90 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Price (small items) */}
            {type === "small" && (item as SmallPriorityItem).price && (
              <span className="text-[11px] text-pink-400 ml-10 block mt-0.5">
                ~{(item as SmallPriorityItem).price}€
              </span>
            )}

            {/* Editing mode */}
            {editingId === item.id && (
              <div className="mt-2 ml-6 flex flex-col gap-1.5">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(item);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="rounded-xl border border-pink-200/60 bg-white px-3 py-1.5 text-sm text-rose-800 focus:outline-none focus:border-pink-300 transition-all"
                  autoFocus
                />
                {type === "small" && (
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Preço (opcional)"
                    className="rounded-xl border border-pink-200/60 bg-white px-3 py-1.5 text-xs text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 transition-all"
                  />
                )}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => saveEdit(item)}
                    className="text-xs bg-gradient-to-r from-pink-400 to-rose-400 text-white px-3 py-1 rounded-lg active:scale-95 transition-all"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs text-pink-400 px-2 py-1 hover:text-pink-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Notes editor */}
            {editingNotes === item.id && (
              <div className="mt-3 ml-8">
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Notas..."
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
            {editingNotes !== item.id &&
              ((item as BigPriorityItem).notes || (item as SmallPriorityItem).notes) && (
                <p className="mt-2 ml-8 text-xs text-pink-400/70 italic">
                  {(item as BigPriorityItem).notes || (item as SmallPriorityItem).notes}
                </p>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
