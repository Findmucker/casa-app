"use client";

import { useState } from "react";
import { LOOT_POOL, type LootItem, type LootSlot, type InventoryItem, type EquippedItems } from "@/lib/gamification";

interface InventoryProps {
  inventory: InventoryItem[];
  equipped: EquippedItems;
  onEquip: (itemId: string, slot: LootSlot) => void;
  onUnequip: (slot: LootSlot) => void;
}

const SLOT_LABELS: { key: LootSlot | "all"; label: string; emoji: string }[] = [
  { key: "all" as LootSlot | "all", label: "Todos", emoji: "🎒" },
  { key: "helmet", label: "Cabeça", emoji: "👒" },
  { key: "weapon", label: "Arma", emoji: "⚔️" },
  { key: "shield", label: "Escudo", emoji: "🛡️" },
  { key: "armor", label: "Corpo", emoji: "👗" },
  { key: "boots", label: "Pés", emoji: "👟" },
  { key: "accessory", label: "Acess.", emoji: "💍" },
];

const RARITY_BORDER: Record<string, string> = {
  common: "border-green-400/50 shadow-green-400/10",
  rare: "border-blue-400/50 shadow-blue-400/15",
  epic: "border-purple-400/50 shadow-purple-400/20",
  legendary: "border-amber-400/60 shadow-amber-400/25",
};

const RARITY_BG: Record<string, string> = {
  common: "from-green-50/60 to-green-100/40",
  rare: "from-blue-50/60 to-blue-100/40",
  epic: "from-purple-50/60 to-purple-100/40",
  legendary: "from-amber-50/60 to-amber-100/40",
};

export default function Inventory({ inventory, equipped, onEquip, onUnequip }: InventoryProps) {
  const [filter, setFilter] = useState<LootSlot | "all">("all");

  const ownedItems: (LootItem & { count: number; isEquipped: boolean })[] = inventory
    .map((inv) => {
      const item = LOOT_POOL.find((i) => i.id === inv.itemId);
      if (!item) return null;
      const isEquipped = equipped[item.slot] === item.id;
      return { ...item, count: inv.count, isEquipped };
    })
    .filter(Boolean) as (LootItem & { count: number; isEquipped: boolean })[];

  const filtered = filter === "all" ? ownedItems : ownedItems.filter((i) => i.slot === filter);

  return (
    <div className="px-4">
      {/* Slot filter tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 mb-3">
        {SLOT_LABELS.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
              filter === s.key
                ? "bg-rose-500/80 text-white border border-rose-400/40 shadow-sm"
                : "bg-white/70 text-purple-600 border border-purple-200/40 hover:bg-white/90"
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Item grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-purple-400 text-xs py-8">Nenhum item neste slot ainda...</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", item.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => {
                if (item.isEquipped) {
                  onUnequip(item.slot);
                } else {
                  onEquip(item.id, item.slot);
                }
              }}
              className={`relative flex flex-col items-center p-2 rounded-xl border-2 bg-gradient-to-b transition-all active:scale-90 shadow-md cursor-grab active:cursor-grabbing ${RARITY_BORDER[item.rarity]} ${RARITY_BG[item.rarity]} ${
                item.isEquipped ? "ring-2 ring-amber-400/60 scale-105" : ""
              }`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-[9px] text-purple-600 mt-1 leading-tight text-center truncate w-full">{item.name}</span>
              {item.count > 1 && (
                <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  x{item.count}
                </span>
              )}
              {item.isEquipped && (
                <span className="absolute top-0.5 left-0.5 text-[10px]">✨</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
