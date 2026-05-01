"use client";

import { useState } from "react";
import { type LootItem } from "@/lib/gamification";

interface LootBoxOpenerProps {
  pendingBoxes: number;
  onOpen: () => Promise<LootItem | null>;
}

const RARITY_GLOW: Record<string, string> = {
  common: "text-green-300 shadow-green-400/50",
  rare: "text-blue-300 shadow-blue-400/50",
  epic: "text-purple-300 shadow-purple-400/50",
  legendary: "text-amber-300 shadow-amber-400/60",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export default function LootBoxOpener({ pendingBoxes, onOpen }: LootBoxOpenerProps) {
  const [phase, setPhase] = useState<"idle" | "shaking" | "opening" | "reveal">("idle");
  const [revealedItem, setRevealedItem] = useState<LootItem | null>(null);

  const handleOpen = async () => {
    if (pendingBoxes <= 0 || phase !== "idle") return;

    setPhase("shaking");
    await sleep(800);
    setPhase("opening");
    await sleep(600);

    const item = await onOpen();
    setRevealedItem(item);
    setPhase("reveal");
  };

  const handleClose = () => {
    setPhase("idle");
    setRevealedItem(null);
  };

  if (pendingBoxes <= 0 && phase === "idle") {
    return (
      <div className="text-center py-3">
        <p className="text-purple-500 text-xs">Nenhuma caixa disponível</p>
        <p className="text-purple-600 text-[10px] mt-0.5">Ganha 1 caixa por cada 50 pontos!</p>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      {phase === "idle" && (
        <>
          <p className="text-purple-300 text-sm font-medium mb-2">
            🎁 {pendingBoxes} {pendingBoxes === 1 ? "caixa disponível" : "caixas disponíveis"}
          </p>
          <button
            onClick={handleOpen}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/30 active:scale-95 transition-all hover:shadow-xl hover:shadow-amber-500/40"
          >
            Abrir Caixa 🎁
          </button>
        </>
      )}

      {phase === "shaking" && (
        <div className="animate-box-shake">
          <span className="text-6xl inline-block">🎁</span>
          <p className="text-purple-300 text-xs mt-2 animate-pulse">A abrir...</p>
        </div>
      )}

      {phase === "opening" && (
        <div className="animate-box-open">
          <span className="text-6xl inline-block">✨</span>
        </div>
      )}

      {phase === "reveal" && revealedItem && (
        <div className="animate-item-reveal">
          {/* Sparkles */}
          <div className="relative inline-block">
            <span className="absolute -top-3 -left-3 text-sm animate-sparkle" style={{ animationDelay: "0s" }}>✨</span>
            <span className="absolute -top-2 right-0 text-sm animate-sparkle" style={{ animationDelay: "0.2s" }}>💫</span>
            <span className="absolute bottom-0 -left-2 text-sm animate-sparkle" style={{ animationDelay: "0.4s" }}>⭐</span>
            <span className="absolute -bottom-1 right--1 text-sm animate-sparkle" style={{ animationDelay: "0.3s" }}>✨</span>
            <span className={`text-6xl inline-block drop-shadow-lg ${RARITY_GLOW[revealedItem.rarity]}`}>
              {revealedItem.emoji}
            </span>
          </div>
          <p className="text-white font-bold text-base mt-3">{revealedItem.name}</p>
          <p className={`text-xs font-medium capitalize ${RARITY_GLOW[revealedItem.rarity]}`}>
            {RARITY_LABEL[revealedItem.rarity]} - {revealedItem.slot}
          </p>
          <p className="text-purple-400 text-[11px] mt-1">{revealedItem.description}</p>

          <button
            onClick={handleClose}
            className="mt-4 px-5 py-1.5 rounded-xl bg-purple-700/50 text-purple-200 text-xs font-medium hover:bg-purple-600/50 transition-all active:scale-95"
          >
            {pendingBoxes > 1 ? "Abrir mais!" : "Fechar"}
          </button>
        </div>
      )}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
