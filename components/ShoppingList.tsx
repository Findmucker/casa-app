"use client";
/* eslint-disable react-hooks/preserve-manual-memoization */
import { useState, useRef, useCallback, useMemo, useEffect, memo } from "react";
import { useCollection, type ShoppingItem } from "@/lib/hooks";
import {
  SHOPPING_CATEGORIES,
  SHOPPING_CATEGORY_ORDER,
  guessCategory,
  getAllCategoryNames,
} from "@/lib/categories";
import AutocompleteInput from "./AutocompleteInput";
import SwipeableRow from "./SwipeableRow";
import { useUndo } from "@/lib/useUndoStack";
import { useT } from "@/lib/i18n";

const COMMON_SHOPPING = [
  "Leite", "Ovos", "Pão", "Manteiga", "Queijo", "Fiambre", "Iogurtes",
  "Arroz", "Massa", "Azeite", "Sal", "Açúcar", "Café", "Chá",
  "Frango", "Carne picada", "Salmão", "Atum", "Batatas", "Cebolas",
  "Alho", "Tomates", "Alface", "Cenouras", "Bananas", "Maçãs", "Laranjas",
  "Papel higiénico", "Detergente", "Sabonete", "Champô", "Pasta de dentes",
  "Água", "Sumo", "Cerveja", "Vinho", "Bolachas", "Cereais", "Chocolate",
];

interface ItemRowProps {
  item: ShoppingItem & { category?: string };
  isDone: boolean;
  celebrating: string | null;
  editingCategory: string | null;
  categoryNames: string[];
  onCheck: (item: ShoppingItem & { category?: string }) => void;
  onUpdate: (id: string, data: Partial<ShoppingItem>) => void;
  onRemove: (id: string) => void;
  onEditCategory: (id: string | null) => void;
}

const ItemRow = memo(function ItemRow({
  item, isDone, celebrating, editingCategory, categoryNames,
  onCheck, onUpdate, onRemove, onEditCategory,
}: ItemRowProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-3.5 transition-all ${
        isDone
          ? "bg-pink-50/40"
          : item.urgent
          ? "bg-gradient-to-r from-red-50/80 to-pink-50/60 border border-red-200/40 shadow-sm shadow-red-100/30"
          : "bg-white/70 backdrop-blur-sm border border-pink-100/30 shadow-sm shadow-pink-100/30 hover:shadow-md"
      }`}
    >
      <div className="relative">
        <button
          onClick={() => onCheck(item)}
          aria-label={isDone ? `Desmarcar ${item.name}` : `Marcar ${item.name} como comprado`}
          className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm transition-all active:scale-90 ${
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
            <span className="absolute text-xs">{"\u{1F495}"}</span>
            <span className="absolute text-xs">{"\u2728"}</span>
          </div>
        )}
      </div>

      <span className={`flex-1 text-base ${isDone ? "text-pink-300 line-through" : "text-rose-800"}`}>
        {item.urgent && !isDone && <span className="text-xs mr-1.5">{"\u{1F525}"}</span>}
        {item.name}
      </span>

      {!isDone && editingCategory === item.id && (
        <select
          aria-label={`Categoria de ${item.name}`}
          value={item.category || "\u{1F4E6} Outros"}
          onChange={(e) => {
            onUpdate(item.id, { category: e.target.value });
            onEditCategory(null);
          }}
          onBlur={() => onEditCategory(null)}
          className="text-xs rounded-xl border border-pink-200 bg-white px-2 py-1 text-rose-700 focus:outline-none"
          autoFocus
        >
          {categoryNames.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      )}

      {!isDone && editingCategory !== item.id && (
        <button
          onClick={() => onEditCategory(item.id)}
          aria-label={`Mudar categoria de ${item.name}`}
          className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-400 hover:bg-pink-100 transition-all"
        >
          {(item.category || "\u{1F4E6}").split(" ")[0]}
        </button>
      )}

      {!isDone && (
        <button
          onClick={() => onUpdate(item.id, { urgent: !item.urgent })}
          aria-label={item.urgent ? `Remover urgente de ${item.name}` : `Marcar ${item.name} como urgente`}
          className={`text-xs px-2 py-1 rounded-full transition-all active:scale-95 ${
            item.urgent
              ? "bg-red-100 text-red-500"
              : "bg-pink-50 text-pink-300 hover:text-pink-500"
          }`}
        >
          {item.urgent ? "\u{1F525}" : ""}
        </button>
      )}

      <button
        onClick={() => onRemove(item.id)}
        aria-label={`Apagar ${item.name}`}
        className="text-pink-200 hover:text-red-400 transition-colors text-sm"
      >
        &#10005;
      </button>
    </div>
  );
});

export default function ShoppingList() {
  const { t } = useT();
  const { items, loading, add, update, remove } =
    useCollection<ShoppingItem>("shopping");
  const [newItem, setNewItem] = useState("");
  const [newUrgent, setNewUrgent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [celebratingCategory, setCelebratingCategory] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const { pushUndo } = useUndo();

  const suggestions = useMemo(() => {
    const fromHistory = items.map((i) => i.name);
    return [...new Set([...fromHistory, ...COMMON_SHOPPING])];
  }, [items]);

  const categoryNames = getAllCategoryNames(SHOPPING_CATEGORIES);
  const hasMigrated = useRef(false);

  // Migrate existing items without category (once per session)
  useEffect(() => {
    if (hasMigrated.current || items.length === 0) return;
    const uncategorized = items.filter((item) => !item.category);
    if (uncategorized.length === 0) return;
    hasMigrated.current = true;
    uncategorized.forEach((item) => {
      const cat = guessCategory(item.name, SHOPPING_CATEGORIES);
      update(item.id, { category: cat });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- migration runs once per session via hasMigrated ref
  }, [items.length, update]);

  // Assign categories to items that don't have one
  const categorizedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      category: item.category || guessCategory(item.name, SHOPPING_CATEGORIES),
    }));
  }, [items]);

  const undone = categorizedItems.filter((i) => !i.done);
  const done = categorizedItems.filter((i) => i.done);
  const urgentItems = undone.filter((i) => i.urgent);
  const normalItems = undone.filter((i) => !i.urgent);

  // Group normal items by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof normalItems> = {};
    for (const cat of SHOPPING_CATEGORY_ORDER) {
      const catItems = normalItems.filter((i) => i.category === cat);
      if (catItems.length > 0) groups[cat] = catItems;
    }
    return groups;
  }, [normalItems]);

  // Progress stats
  const totalAll = items.length;
  const totalDone = done.length;

  const handleCheck = useCallback(async (item: ShoppingItem & { category?: string }) => {
    if (!item.done) {
      setCelebrating(item.id);
      setTimeout(() => setCelebrating(null), 600);

      // Check if this completes the category
      const cat = item.category || guessCategory(item.name, SHOPPING_CATEGORIES);
      const catUndone = normalItems.filter((i) => i.category === cat && i.id !== item.id);
      if (catUndone.length === 0) {
        setCelebratingCategory(cat);
        setTimeout(() => setCelebratingCategory(null), 1500);
        // Auto-collapse completed category
        setCollapsedCategories((prev) => new Set([...prev, cat]));
      }
    }
    await update(item.id, { done: !item.done });
  }, [update, normalItems]);

  const handleAdd = async () => {
    const name = newItem.trim();
    if (!name) return;
    const category = guessCategory(name, SHOPPING_CATEGORIES);
    await add({ name, addedBy: "", done: false, urgent: newUrgent, category });
    setNewItem("");
    setNewUrgent(false);
    inputRef.current?.focus();
  };

  const removeWithUndo = useCallback((item: ShoppingItem) => {
    const data = { name: item.name, addedBy: item.addedBy || "", done: item.done, urgent: item.urgent, category: (item as ShoppingItem & { category?: string }).category };
    remove(item.id);
    pushUndo(`"${item.name}" apagado`, async () => {
      await add(data as Omit<ShoppingItem, "id" | "createdAt">);
    });
  }, [remove, add, pushUndo]);

  const toggleCollapse = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const allCategories = Object.keys(groupedByCategory || {});
  const allCollapsed = allCategories.length > 0 && allCategories.every((c) => collapsedCategories.has(c));
  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsedCategories(new Set());
    } else {
      setCollapsedCategories(new Set(allCategories));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add form */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-pink-100/40 space-y-2">
        {/* Global progress */}
        {totalAll > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-rose-400">
              🛒 {totalDone}/{totalAll} {t("shopping.progress")}
            </span>
            <div className="flex-1 h-2 bg-pink-100/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-300 to-rose-400 rounded-full transition-all duration-500"
                style={{ width: `${totalAll > 0 ? (totalDone / totalAll) * 100 : 0}%` }}
              />
            </div>
            {totalDone === totalAll && totalAll > 0 && (
              <span className="text-xs animate-bounce">🎉</span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <AutocompleteInput
            inputRef={inputRef}
            value={newItem}
            onChange={setNewItem}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={t("shopping.placeholder")}
            suggestions={suggestions}
            className="flex-1 rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-base text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50 transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!newItem.trim()}
            aria-label="Adicionar item"
            className="rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-5 py-3 text-white font-semibold hover:from-pink-500 hover:to-rose-500 active:scale-95 transition-all disabled:opacity-30 shadow-sm shadow-pink-200/50"
          >
            +
          </button>
        </div>
        <button
          onClick={() => setNewUrgent(!newUrgent)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all active:scale-95 ${
            newUrgent
              ? "bg-red-100 text-red-500 shadow-sm"
              : "bg-pink-50/80 text-pink-400 hover:bg-pink-100"
          }`}
        >
          <span>{newUrgent ? "🔥" : "🕊️"}</span>
          <span>{newUrgent ? t("shopping.urgent") : t("shopping.normal")}</span>
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {loading && (
          <div className="text-center text-pink-300 py-12 animate-pulse-soft">
            <div className="text-3xl mb-2">🛒</div>
            <p className="text-sm">{t("common.loading")}</p>
          </div>
        )}

        {!loading && undone.length === 0 && done.length === 0 && (
          <div className="text-center text-pink-300 py-12">
            <div className="text-5xl mb-3 animate-float">🛒</div>
            <p className="text-sm">{t("shopping.empty")}</p>
            <p className="text-xs text-pink-200 mt-1">{t("shopping.emptyHint")}</p>
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
              <SwipeableRow key={item.id} onSwipeRight={() => handleCheck(item)} onSwipeLeft={() => removeWithUndo(item)}>
                <ItemRow item={item} isDone={false} celebrating={celebrating} editingCategory={editingCategory} categoryNames={categoryNames} onCheck={handleCheck} onUpdate={update} onRemove={() => removeWithUndo(item)} onEditCategory={setEditingCategory} />
              </SwipeableRow>
            ))}
          </>
        )}

        {/* Categorized sections */}
        {Object.keys(groupedByCategory).length > 1 && (
          <button
            onClick={toggleAll}
            className="text-[11px] text-pink-400 hover:text-pink-600 transition-colors self-end"
          >
            {allCollapsed ? "▼ " + t("priority.expandAll") : "▲ " + t("priority.collapseAll")}
          </button>
        )}
        {Object.entries(groupedByCategory).map(([category, catItems]) => {
          const isCollapsed = collapsedCategories.has(category);
          const catDone = categorizedItems.filter(
            (i) => i.done && i.category === category
          ).length;
          const catTotal = catItems.length + catDone;
          const isComplete = celebratingCategory === category;

          return (
            <div key={category} className="mt-3">
              {/* Category header */}
              <button
                onClick={() => toggleCollapse(category)}
                className={`w-full flex items-center gap-2 pb-2 transition-all ${
                  isComplete ? "animate-category-complete" : ""
                }`}
              >
                <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
                  {category}
                </span>
                <span className="bg-pink-100 text-pink-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {catDone}/{catTotal}
                </span>
                {/* Mini progress */}
                <div className="flex-1 h-1.5 bg-pink-100/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-300 to-rose-400 rounded-full transition-all duration-500"
                    style={{ width: `${catTotal > 0 ? (catDone / catTotal) * 100 : 0}%` }}
                  />
                </div>
                {isComplete && (
                  <span className="text-sm animate-bounce">🎉</span>
                )}
                <span className="text-pink-300 text-xs">{isCollapsed ? "▶" : "▼"}</span>
              </button>

              {/* Category items */}
              {!isCollapsed && (
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <SwipeableRow key={item.id} onSwipeRight={() => handleCheck(item)} onSwipeLeft={() => removeWithUndo(item)}>
                      <ItemRow item={item} isDone={false} celebrating={celebrating} editingCategory={editingCategory} categoryNames={categoryNames} onCheck={handleCheck} onUpdate={update} onRemove={() => removeWithUndo(item)} onEditCategory={setEditingCategory} />
                    </SwipeableRow>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Done section */}
        {done.length > 0 && (
          <>
            <div className="text-xs font-semibold text-pink-300 uppercase tracking-wider pt-4 pb-1 flex items-center gap-2">
              <span>✓ {t("shopping.done")}</span>
              <span className="bg-pink-100 text-pink-400 px-2 py-0.5 rounded-full text-[10px]">
                {done.length}
              </span>
            </div>
            {done.map((item) => (
              <SwipeableRow key={item.id} onSwipeLeft={() => removeWithUndo(item)} disabled>
                <ItemRow item={item} isDone={true} celebrating={celebrating} editingCategory={editingCategory} categoryNames={categoryNames} onCheck={handleCheck} onUpdate={update} onRemove={() => removeWithUndo(item)} onEditCategory={setEditingCategory} />
              </SwipeableRow>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
