"use client";

import { useState, useEffect } from "react";
import { BADGES, type GameStats } from "@/lib/gamification";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useHouseContext } from "@/lib/context";

interface GamificationProps {
  onClose: () => void;
}

export default function Gamification({ onClose }: GamificationProps) {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const { userName } = useHouseContext();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "gamification", userName), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as GameStats & { badges?: string[] };
        setStats(data);
        setEarnedBadges(data.badges || []);
      } else {
        setStats({ points: 0, totalCompleted: 0, maxStreak: 0, shoppingDone: 0, coisinhasDone: 0, projectsDone: 0, habitsDone: 0 });
      }
    });
    return () => unsub();
  }, [userName]);

  if (!stats) return null;

  const level = Math.floor(stats.points / 50) + 1;
  const pointsInLevel = stats.points % 50;
  const pctToNext = (pointsInLevel / 50) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50/98 via-yellow-50/98 to-orange-50/98 backdrop-blur-md z-50 flex flex-col items-center overflow-y-auto animate-fade-in-up p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-2 animate-bounce-gentle">🏆</div>
        <h2 className="text-xl font-bold text-amber-700">Nível {level}</h2>
        <p className="text-sm text-amber-500">{stats.points} pontos totais</p>
      </div>

      {/* Level progress */}
      <div className="w-full max-w-xs mb-6">
        <div className="flex justify-between text-[10px] text-amber-500 mb-1">
          <span>Nível {level}</span>
          <span>Nível {level + 1}</span>
        </div>
        <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700"
            style={{ width: `${pctToNext}%` }}
          />
        </div>
        <p className="text-[10px] text-amber-400 text-center mt-1">{50 - pointsInLevel} pts para o próximo nível</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-6">
        <div className="bg-white/60 rounded-xl p-3 text-center border border-amber-100/40">
          <p className="text-lg font-bold text-amber-700">{stats.shoppingDone}</p>
          <p className="text-[10px] text-amber-500">🛒 Compras</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 text-center border border-amber-100/40">
          <p className="text-lg font-bold text-amber-700">{stats.coisinhasDone}</p>
          <p className="text-[10px] text-amber-500">🪴 Coisinhas</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 text-center border border-amber-100/40">
          <p className="text-lg font-bold text-amber-700">{stats.projectsDone}</p>
          <p className="text-[10px] text-amber-500">🏠 Projetos</p>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-white/60 rounded-2xl p-4 w-full max-w-xs mb-6 border border-orange-100/40 text-center">
        <span className="text-3xl">🔥</span>
        <p className="text-lg font-bold text-orange-600">{stats.maxStreak} dias</p>
        <p className="text-[11px] text-orange-400">Melhor streak</p>
      </div>

      {/* Badges */}
      <div className="w-full max-w-xs">
        <p className="text-sm font-semibold text-amber-600 mb-3">🎖️ Badges</p>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((badge) => {
            const earned = earnedBadges.includes(badge.id) || badge.condition(stats);
            return (
              <div
                key={badge.id}
                className={`rounded-xl p-3 text-center transition-all ${
                  earned
                    ? "bg-white/80 border border-amber-200/60 shadow-sm"
                    : "bg-gray-100/50 border border-gray-200/30 opacity-40"
                }`}
              >
                <span className="text-2xl">{badge.emoji}</span>
                <p className="text-[9px] font-medium text-amber-700 mt-1 leading-tight">{badge.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onClose}
        className="mt-8 text-sm text-amber-500 hover:text-amber-700 transition-colors"
      >
        Fechar
      </button>
    </div>
  );
}
