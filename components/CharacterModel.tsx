"use client";

import { LOOT_POOL, type EquippedItems } from "@/lib/gamification";

interface CharacterModelProps {
  equipped: EquippedItems;
  size?: "sm" | "md" | "lg";
}

export default function CharacterModel({ equipped, size = "md" }: CharacterModelProps) {
  const getItem = (itemId: string | undefined) => {
    if (!itemId) return null;
    return LOOT_POOL.find((i) => i.id === itemId);
  };

  const helmet = getItem(equipped.helmet);
  const weapon = getItem(equipped.weapon);
  const shield = getItem(equipped.shield);
  const armor = getItem(equipped.armor);
  const boots = getItem(equipped.boots);
  const accessory = getItem(equipped.accessory);

  const hasAnyEquipment = Object.values(equipped).some(Boolean);
  const scales = { sm: 0.6, md: 1, lg: 1.4 };
  const scale = scales[size];

  // If no equipment at all, show a cute chibi placeholder
  if (!hasAnyEquipment) {
    return (
      <div
        className="relative select-none flex flex-col items-center justify-center"
        style={{ width: `${120 * scale}px`, height: `${160 * scale}px` }}
      >
        <div className="animate-bounce-gentle">
          <div className="rounded-full bg-gradient-to-br from-rose-200 to-pink-300 border-2 border-rose-300/50 shadow-lg flex items-center justify-center"
            style={{ width: `${60 * scale}px`, height: `${60 * scale}px` }}>
            <span style={{ fontSize: `${28 * scale}px` }}>⚔️</span>
          </div>
        </div>
        <p className="text-[10px] text-purple-400 mt-2 text-center">Sem equipamento</p>
      </div>
    );
  }

  return (
    <div
      className="relative select-none"
      style={{ width: `${120 * scale}px`, height: `${160 * scale}px`, perspective: "400px" }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-end animate-breathe" style={{ transformStyle: "preserve-3d" }}>
        {/* Helmet */}
        <div className="absolute flex items-center justify-center" style={{ top: `${2 * scale}px`, fontSize: `${24 * scale}px` }}>
          {helmet ? helmet.emoji : ""}
        </div>

        {/* Head */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-amber-200 to-amber-300 border-2 border-amber-400/50 shadow-md flex items-center justify-center"
          style={{
            top: `${20 * scale}px`,
            width: `${44 * scale}px`,
            height: `${44 * scale}px`,
          }}
        >
          {/* Eyes */}
          <div className="flex gap-1.5" style={{ marginTop: `${2 * scale}px` }}>
            <div className="rounded-full bg-slate-800" style={{ width: `${5 * scale}px`, height: `${6 * scale}px` }} />
            <div className="rounded-full bg-slate-800" style={{ width: `${5 * scale}px`, height: `${6 * scale}px` }} />
          </div>
        </div>

        {/* Body */}
        <div
          className="absolute rounded-[40%] bg-gradient-to-b from-pink-300 to-purple-400 border-2 border-purple-500/40 shadow-inner"
          style={{
            top: `${62 * scale}px`,
            width: `${38 * scale}px`,
            height: `${50 * scale}px`,
          }}
        >
          {/* Armor overlay */}
          {armor && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[40%] opacity-80" style={{ fontSize: `${22 * scale}px` }}>
              {armor.emoji}
            </div>
          )}
          {/* Accessory */}
          {accessory && (
            <div className="absolute flex items-center justify-center" style={{ top: `${4 * scale}px`, right: `${-2 * scale}px`, fontSize: `${14 * scale}px` }}>
              {accessory.emoji}
            </div>
          )}
        </div>

        {/* Left arm (shield) */}
        <div
          className="absolute rounded-full bg-gradient-to-b from-amber-200 to-amber-300 border border-amber-400/40"
          style={{
            top: `${68 * scale}px`,
            left: `${22 * scale}px`,
            width: `${14 * scale}px`,
            height: `${30 * scale}px`,
            transform: "rotate(12deg)",
          }}
        />
        {shield && (
          <div className="absolute" style={{ top: `${72 * scale}px`, left: `${10 * scale}px`, fontSize: `${18 * scale}px` }}>
            {shield.emoji}
          </div>
        )}

        {/* Right arm (weapon) */}
        <div
          className="absolute rounded-full bg-gradient-to-b from-amber-200 to-amber-300 border border-amber-400/40"
          style={{
            top: `${68 * scale}px`,
            right: `${22 * scale}px`,
            width: `${14 * scale}px`,
            height: `${30 * scale}px`,
            transform: "rotate(-12deg)",
          }}
        />
        {weapon && (
          <div className="absolute" style={{ top: `${62 * scale}px`, right: `${8 * scale}px`, fontSize: `${18 * scale}px` }}>
            {weapon.emoji}
          </div>
        )}

        {/* Legs */}
        <div className="absolute flex" style={{ bottom: `${4 * scale}px`, gap: `${6 * scale}px` }}>
          <div
            className="rounded-full bg-gradient-to-b from-amber-200 to-amber-300 border border-amber-400/40"
            style={{ width: `${12 * scale}px`, height: `${26 * scale}px` }}
          />
          <div
            className="rounded-full bg-gradient-to-b from-amber-200 to-amber-300 border border-amber-400/40"
            style={{ width: `${12 * scale}px`, height: `${26 * scale}px` }}
          />
        </div>

        {/* Boots */}
        {boots && (
          <div className="absolute flex" style={{ bottom: `${0}px`, gap: `${10 * scale}px`, fontSize: `${14 * scale}px` }}>
            <span>{boots.emoji}</span>
            <span>{boots.emoji}</span>
          </div>
        )}
      </div>
    </div>
  );
}
