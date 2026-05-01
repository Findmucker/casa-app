"use client";

import { useState, useMemo } from "react";
import { useCollection, type MealPlan, type ShoppingItem } from "@/lib/hooks";

const MEAL_SLOTS = [
  { key: "breakfast", label: "Pequeno-almoço", emoji: "🥐" },
  { key: "lunch", label: "Almoço", emoji: "🍽️" },
  { key: "dinner", label: "Jantar", emoji: "🍲" },
  { key: "snack", label: "Snack", emoji: "🍎" },
] as const;

type SlotKey = (typeof MEAL_SLOTS)[number]["key"];

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function MealPlanner() {
  const { items, loading, add, update } = useCollection<MealPlan>("meal_plans", "createdAt");
  const { add: addShopping } = useCollection<ShoppingItem>("shopping", "createdAt");
  const [editingSlot, setEditingSlot] = useState<{ date: string; slot: SlotKey } | null>(null);
  const [slotText, setSlotText] = useState("");
  const [ingredientsModal, setIngredientsModal] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState("");

  // Get 7 days starting from today
  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      result.push({
        date: d.toISOString().split("T")[0],
        dayName: WEEKDAYS_PT[d.getDay()],
        dayNum: d.getDate(),
        isToday: i === 0,
      });
    }
    return result;
  }, []);

  // Map date → MealPlan
  const plansByDate = useMemo(() => {
    const map: Record<string, MealPlan> = {};
    items.forEach((i) => { map[i.date] = i; });
    return map;
  }, [items]);

  // Get past meals for autocomplete
  const pastMeals = useMemo(() => {
    const meals = new Set<string>();
    items.forEach((p) => {
      if (p.breakfast) meals.add(p.breakfast);
      if (p.lunch) meals.add(p.lunch);
      if (p.dinner) meals.add(p.dinner);
      if (p.snack) meals.add(p.snack);
    });
    return [...meals];
  }, [items]);

  const saveSlot = async () => {
    if (!editingSlot || !slotText.trim()) {
      setEditingSlot(null);
      return;
    }

    const existing = plansByDate[editingSlot.date];
    if (existing) {
      await update(existing.id, { [editingSlot.slot]: slotText.trim() });
    } else {
      await add({
        date: editingSlot.date,
        [editingSlot.slot]: slotText.trim(),
      } as Omit<MealPlan, "id">);
    }
    setEditingSlot(null);
    setSlotText("");
  };

  const sendToShopping = async () => {
    if (!ingredients.trim()) return;
    const lines = ingredients.split("\n").filter((l) => l.trim());
    for (const item of lines) {
      await addShopping({
        name: item.trim(),
        addedBy: "meal-planner",
        done: false,
        urgent: false,
        createdAt: null,
      } as Omit<ShoppingItem, "id">);
    }
    setIngredients("");
    setIngredientsModal(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-white/60 backdrop-blur-sm sticky top-0 z-10 border-b border-orange-100/40">
        <h2 className="text-lg font-bold text-orange-600">🍽️ Receitinhas</h2>
        <p className="text-[11px] text-orange-400 mt-0.5">Plano semanal de refeições</p>
      </div>

      {/* Week view */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="text-center text-orange-300 py-12 animate-pulse-soft">
            <div className="text-3xl mb-2">🍽️</div>
            <p className="text-sm">A carregar...</p>
          </div>
        )}

        {!loading && days.map((day) => {
          const plan = plansByDate[day.date];
          return (
            <div
              key={day.date}
              className={`bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border transition-all ${
                day.isToday ? "border-orange-300/60 shadow-orange-100/40" : "border-orange-100/30"
              }`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${day.isToday ? "text-orange-600" : "text-orange-800"}`}>
                    {day.dayName}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    day.isToday ? "bg-orange-200 text-orange-700" : "bg-orange-50 text-orange-400"
                  }`}>
                    {day.dayNum}
                  </span>
                  {day.isToday && <span className="text-xs text-orange-500 font-medium">Hoje</span>}
                </div>
                <button
                  onClick={() => setIngredientsModal(day.date)}
                  className="text-[11px] text-orange-400 hover:text-orange-600 px-2 py-1 rounded-lg hover:bg-orange-50 transition-all active:scale-95"
                >
                  🛒 Ingredientes
                </button>
              </div>

              {/* Meal slots */}
              <div className="grid grid-cols-2 gap-2">
                {MEAL_SLOTS.map((slot) => {
                  const value = plan?.[slot.key as keyof MealPlan] as string | undefined;
                  const isEditing = editingSlot?.date === day.date && editingSlot.slot === slot.key;

                  if (isEditing) {
                    return (
                      <div key={slot.key} className="col-span-2">
                        <input
                          type="text"
                          value={slotText}
                          onChange={(e) => setSlotText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveSlot();
                            if (e.key === "Escape") setEditingSlot(null);
                          }}
                          onBlur={saveSlot}
                          placeholder={`${slot.emoji} ${slot.label}...`}
                          className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-orange-800 placeholder-orange-300 focus:outline-none focus:border-orange-400"
                          autoFocus
                          list={`suggestions-${day.date}-${slot.key}`}
                        />
                        <datalist id={`suggestions-${day.date}-${slot.key}`}>
                          {pastMeals.map((m) => <option key={m} value={m} />)}
                        </datalist>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slot.key}
                      onClick={() => {
                        setEditingSlot({ date: day.date, slot: slot.key });
                        setSlotText(value || "");
                      }}
                      className={`rounded-xl px-3 py-2 text-left transition-all active:scale-[0.97] ${
                        value
                          ? "bg-orange-50 border border-orange-200/40"
                          : "bg-gray-50/50 border border-dashed border-orange-200/30 hover:border-orange-300/50"
                      }`}
                    >
                      <p className="text-[10px] text-orange-400">{slot.emoji} {slot.label}</p>
                      <p className={`text-xs mt-0.5 truncate ${value ? "text-orange-800 font-medium" : "text-orange-300"}`}>
                        {value || "—"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ingredients modal */}
      {ingredientsModal && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in-up">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-5 space-y-3">
            <h3 className="font-semibold text-orange-700">🛒 Enviar ingredientes para comprinhas</h3>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Um ingrediente por linha...&#10;Ex: Frango&#10;Arroz&#10;Tomate"
              className="w-full h-32 rounded-xl border border-orange-200 bg-orange-50/30 px-4 py-3 text-sm text-orange-800 placeholder-orange-300 focus:outline-none focus:border-orange-400 resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={sendToShopping}
                disabled={!ingredients.trim()}
                className="flex-1 rounded-xl bg-gradient-to-r from-orange-400 to-pink-400 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-30"
              >
                Enviar para comprinhas
              </button>
              <button
                onClick={() => setIngredientsModal(null)}
                className="px-4 py-2.5 text-sm text-orange-400 hover:text-orange-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
