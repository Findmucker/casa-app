"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import TabTip from "@/components/TabTip";
import { useCollection, type SmallPriorityItem } from "@/lib/hooks";
import {
  COISINHAS_CATEGORIES,
  COISINHAS_CATEGORY_ORDER,
  guessCategory,
} from "@/lib/categories";
import { useMemberNames } from "@/lib/context";
import AutocompleteInput from "./AutocompleteInput";
import MiniAvatar from "./MiniAvatar";
import SwipeableRow from "./SwipeableRow";
import { useUndo } from "@/lib/useUndoStack";
import { useT } from "@/lib/i18n";

const COMMON_COISINHAS = [
  "Aspirador", "Toalhas", "Cortinas", "Almofadas", "Velas", "Plantas",
  "Organizador", "Caixas", "Prateleira", "Espelho", "Tapete", "Candeeiro",
  "Molduras", "Puxadores", "Ganchos", "Cabides", "Cesto roupa",
  "Mudar morada", "Marcar consulta", "Pagar fatura", "Renovar seguro",
];

export default function PriorityList() {
  const { t } = useT();
  const memberNames = useMemberNames();
  const { items, loading, add, update, remove } = useCollection<SmallPriorityItem>(
    "priorities_small",
    "order"
  );
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newAssignee, setNewAssignee] = useState("ambos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const { pushUndo } = useUndo();
  // Track items completed in this session (shown with strikethrough, hidden next session)
  const [doneThisSession, setDoneThisSession] = useState<Set<string>>(new Set());

  // Filter: hide items done in previous sessions (but keep items done this session visible)
  const visibleItems = useMemo(() =>
    items.filter((i) => !i.done || doneThisSession.has(i.id)),
    [items, doneThisSession]
  );

  const nameSuggestions = useMemo(() => {
    const fromHistory = items.map((i) => i.name);
    return [...new Set([...fromHistory, ...COMMON_COISINHAS])];
  }, [items]);

  // Auto-migrate items without category (once per session)
  const hasMigrated = useRef(false);
  useEffect(() => {
    if (hasMigrated.current || items.length === 0) return;
    const uncategorized = items.filter((item) => !item.category);
    if (uncategorized.length === 0) return;
    hasMigrated.current = true;
    uncategorized.forEach((item) => {
      update(item.id, { category: guessCategory(item.name, COISINHAS_CATEGORIES) });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- migration runs once per session via hasMigrated ref
  }, [items.length, update]);

  const cycleAssignee = (current: string): string => {
    const keys = memberNames.map((m) => m.key);
    const idx = keys.indexOf(current);
    return keys[(idx + 1) % keys.length];
  };

  const handleToggleDone = useCallback(async (item: SmallPriorityItem) => {
    if (!item.done) {
      setCelebrating(item.id);
      setTimeout(() => setCelebrating(null), 600);
      setDoneThisSession((s) => new Set(s).add(item.id));
    } else {
      setDoneThisSession((s) => { const n = new Set(s); n.delete(item.id); return n; });
    }
    await update(item.id, {
      done: !item.done,
      completedAt: !item.done ? new Date().toISOString().split("T")[0] : undefined,
    });
  }, [update, visibleItems]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) : 0;
    const category = guessCategory(name, COISINHAS_CATEGORIES);
    await add({
      name,
      done: false,
      order: maxOrder + 1,
      assignee: newAssignee,
      category,
      ...(newPrice ? { price: parseFloat(newPrice) } : {}),
    });
    setNewName("");
    setNewPrice("");
  };

  const startEditing = (item: SmallPriorityItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price?.toString() || "");
  };

  const saveEdit = async (item: SmallPriorityItem) => {
    const name = editName.trim();
    if (!name) return;
    await update(item.id, { name, price: editPrice ? parseFloat(editPrice) : undefined });
    setEditingId(null);
  };

  const moveItem = async (item: SmallPriorityItem, direction: "up" | "down", catItems: SmallPriorityItem[]) => {
    const idx = catItems.findIndex((i) => i.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= catItems.length) return;
    const other = catItems[swapIdx];
    await update(item.id, { order: other.order });
    await update(other.id, { order: item.order });
  };

  const removeWithUndo = useCallback((item: SmallPriorityItem) => {
    const data = { name: item.name, done: item.done, order: item.order, assignee: item.assignee, category: item.category, notes: item.notes, price: item.price };
    remove(item.id);
    pushUndo(`"${item.name}" ${t("priority.deleted")}`, async () => {
      await add(data as Omit<SmallPriorityItem, "id" | "createdAt">);
    });
  }, [remove, add, pushUndo]);

  return (
    <div className="flex flex-col h-full">
      <TabTip tabId="small" emoji="🪄" titleKey="tutorial.coisinhas.title" tips={["tutorial.coisinhas.tip1", "tutorial.coisinhas.tip2", "tutorial.coisinhas.tip3", "tutorial.coisinhas.tip4"]} />
      {/* Add form */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-pink-100/40 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setNewAssignee(cycleAssignee(newAssignee))}
            className="w-12 h-12 flex-shrink-0 rounded-2xl bg-pink-50 border border-pink-200/60 flex items-center justify-center transition-all active:scale-90 hover:bg-pink-100"
            title={memberNames.find((m) => m.key === newAssignee)?.label || "Ambos"}
          >
            {newAssignee !== "ambos" ? <MiniAvatar name={newAssignee} size={28} showEquipBadge={false} /> : <span className="text-xl">👫</span>}
          </button>
          <AutocompleteInput
            value={newName}
            onChange={setNewName}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={t("priority.placeholder")}
            suggestions={nameSuggestions}
            className="flex-1 min-w-0 rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-base text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50 transition-all"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder={t("priority.price")}
              className="w-14 rounded-xl border border-pink-200/60 bg-white/80 px-2 py-3 text-sm text-right text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 transition-all"
            />
            <span className="text-xs text-pink-300">€</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-5 py-3 text-white font-semibold hover:from-pink-500 hover:to-rose-500 active:scale-95 transition-all disabled:opacity-30 shadow-sm shadow-pink-200/50"
          >
            +
          </button>
        </div>
      </div>

      {/* Items grouped by category */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {loading && (
          <div className="text-center text-pink-300 py-12 animate-pulse-soft">
            <div className="text-3xl mb-2">🪄</div>
            <p className="text-sm">{t("common.loading")}</p>
          </div>
        )}

        {!loading && visibleItems.length === 0 && (
          <div className="text-center text-pink-300 py-12">
            <div className="text-5xl mb-3 animate-float">🪄</div>
            <p className="text-sm">{t("priority.empty")}</p>
            <p className="text-xs text-pink-200 mt-1">{t("priority.emptyHint")}</p>
          </div>
        )}

        {/* Category boxes */}
        {!loading && visibleItems.length > 0 && (
          <button
            onClick={() => {
              const cats = COISINHAS_CATEGORY_ORDER.filter((c) => visibleItems.some((i) => (i.category || guessCategory(i.name, COISINHAS_CATEGORIES)) === c));
              const allCol = cats.every((c) => collapsedCategories.has(c));
              setCollapsedCategories(allCol ? new Set() : new Set(cats));
            }}
            className="text-[11px] text-pink-400 hover:text-pink-600 transition-colors mb-2 self-end"
          >
            {COISINHAS_CATEGORY_ORDER.filter((c) => visibleItems.some((i) => (i.category || guessCategory(i.name, COISINHAS_CATEGORIES)) === c)).every((c) => collapsedCategories.has(c)) ? "▼ " + t("priority.expandAll") : "▲ " + t("priority.collapseAll")}
          </button>
        )}
        {!loading && visibleItems.length > 0 && COISINHAS_CATEGORY_ORDER.map((cat) => {
          const catItems = visibleItems.filter(
            (i) => (i.category || guessCategory(i.name, COISINHAS_CATEGORIES)) === cat
          );
          if (catItems.length === 0) return null;
          const isCollapsed = collapsedCategories.has(cat);
          const catDone = catItems.filter((i) => i.done).length;
          const isComplete = catDone === catItems.length;

          return (
            <div key={cat} className="mb-3 animate-fade-in-up">
              {/* Category header */}
              <button
                onClick={() => {
                  setCollapsedCategories((prev) => {
                    const next = new Set(prev);
                    if (next.has(cat)) next.delete(cat); else next.add(cat);
                    return next;
                  });
                }}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl transition-all active:scale-[0.98] ${
                  isComplete
                    ? "bg-green-50/80 border border-green-200/40"
                    : "bg-white/80 border border-pink-100/40 shadow-sm shadow-pink-100/20"
                }`}
              >
                <span className="text-base">{cat.split(" ")[0]}</span>
                <span className={`text-sm font-semibold flex-1 text-left ${isComplete ? "text-green-600" : "text-rose-600"}`}>
                  {cat.split(" ").slice(1).join(" ")}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isComplete ? "bg-green-100 text-green-600" : "bg-pink-100 text-pink-500"
                }`}>
                  {catDone}/{catItems.length}
                </span>
                <span className="text-pink-300 text-xs ml-1">{isCollapsed ? "▶" : "▼"}</span>
              </button>

              {/* Items */}
              {!isCollapsed && (
                <div className="mt-2 ml-2 space-y-2">
                  {catItems.map((item, idx) => (
                    <SwipeableRow key={item.id} onSwipeRight={() => handleToggleDone(item)} onSwipeLeft={() => removeWithUndo(item)}>
                    <div
                      className={`bg-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-sm shadow-pink-100/30 border border-pink-100/30 transition-all hover:shadow-md animate-fade-in-up ${
                        item.done ? "opacity-50" : ""
                      }`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            onClick={() => idx > 0 && moveItem(item, "up", catItems)}
                            aria-label={t("priority.reorder")}
                            className={`w-5 h-4 flex items-center justify-center text-[9px] rounded transition-all active:scale-90 ${
                              idx > 0 ? "text-pink-400 hover:text-pink-600 hover:bg-pink-50" : "text-pink-200 cursor-default"
                            }`}
                          >▲</button>
                          <button
                            onClick={() => idx < catItems.length - 1 && moveItem(item, "down", catItems)}
                            aria-label={t("priority.reorder")}
                            className={`w-5 h-4 flex items-center justify-center text-[9px] rounded transition-all active:scale-90 ${
                              idx < catItems.length - 1 ? "text-pink-400 hover:text-pink-600 hover:bg-pink-50" : "text-pink-200 cursor-default"
                            }`}
                          >▼</button>
                        </div>

                        {/* Checkbox */}
                        <div className="relative">
                          <button
                            onClick={() => handleToggleDone(item)}
                            aria-label={item.done ? `${t("priority.uncheck")} ${item.name}` : `${t("priority.markDone")} ${item.name}`}
                            className={`h-7 w-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs transition-all active:scale-90 ${
                              item.done
                                ? "bg-gradient-to-r from-pink-300 to-rose-300 border-pink-300 text-white"
                                : "border-pink-300 hover:bg-pink-100"
                            } ${celebrating === item.id ? "animate-celebrate" : ""}`}
                          >
                            {item.done ? "✓" : ""}
                          </button>
                          {celebrating === item.id && (
                            <div className="absolute inset-0 flex items-center justify-center confetti-burst pointer-events-none">
                              <span className="absolute text-xs">💕</span>
                              <span className="absolute text-xs">✨</span>
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <span
                          onClick={() => startEditing(item)}
                          className={`flex-1 text-sm cursor-pointer truncate ${
                            item.done ? "line-through text-pink-300" : "text-rose-800"
                          }`}
                        >
                          {item.name}
                        </span>

                        {/* Assignee */}
                        <button
                          onClick={() => update(item.id, { assignee: cycleAssignee(item.assignee || "ambos") })}
                          className="w-8 h-8 flex-shrink-0 rounded-full bg-pink-50 flex items-center justify-center hover:bg-pink-100 active:scale-90 transition-all"
                        >
                          {(item.assignee && item.assignee !== "ambos")
                            ? <MiniAvatar name={item.assignee} size={24} />
                            : <span className="text-sm">{memberNames.find((m) => m.key === (item.assignee || "ambos"))?.emoji || "👫"}</span>
                          }
                        </button>

                        {/* Notes */}
                        <button
                          onClick={() => {
                            if (editingNotes === item.id) {
                              update(item.id, { notes: notesText });
                              setEditingNotes(null);
                            } else {
                              setEditingNotes(item.id);
                              setNotesText(item.notes || "");
                            }
                          }}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all active:scale-90 ${
                            item.notes ? "bg-pink-100 text-pink-500" : "text-pink-300 hover:text-pink-500"
                          }`}
                        >📝</button>

                        {/* Delete */}
                        <button
                          onClick={() => removeWithUndo(item)}
                          aria-label={`${t("priority.delete")} ${item.name}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-pink-300 hover:text-red-400 transition-all active:scale-90 text-sm"
                        >✕</button>
                      </div>

                      {/* Price */}
                      {item.price && (
                        <span className="text-[11px] text-pink-400 ml-10 block mt-0.5">~{item.price}€</span>
                      )}

                      {/* Edit mode */}
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
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            placeholder={t("priority.price")}
                            className="rounded-xl border border-pink-200/60 bg-white px-3 py-1.5 text-xs text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 transition-all"
                          />
                          <div className="flex gap-1.5">
                            <button onClick={() => saveEdit(item)} className="text-xs bg-gradient-to-r from-pink-400 to-rose-400 text-white px-3 py-1 rounded-lg active:scale-95 transition-all">{t("common.save")}</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-pink-400 px-2 py-1 hover:text-pink-600 transition-colors">{t("common.cancel")}</button>
                          </div>
                        </div>
                      )}

                      {/* Notes editor */}
                      {editingNotes === item.id && (
                        <div className="mt-3 ml-8">
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder={t("priority.notes")}
                            className="w-full rounded-xl border border-pink-200/60 bg-white/80 px-3 py-2 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 resize-none transition-all"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => { update(item.id, { notes: notesText }); setEditingNotes(null); }} className="text-xs bg-gradient-to-r from-pink-400 to-rose-400 text-white px-4 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all">{t("common.save")}</button>
                            <button onClick={() => setEditingNotes(null)} className="text-xs text-pink-400 px-3 py-1.5 hover:text-pink-600 transition-colors">{t("common.cancel")}</button>
                          </div>
                        </div>
                      )}

                      {/* Notes display */}
                      {editingNotes !== item.id && item.notes && (
                        <p className="mt-2 ml-8 text-xs text-pink-400/70 italic">{item.notes}</p>
                      )}
                    </div>
                    </SwipeableRow>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
