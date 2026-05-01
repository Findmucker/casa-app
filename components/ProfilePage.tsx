"use client";

import { useState, useEffect, useContext } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HouseIdContext } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import {
  getStats,
  getLevel,
  getTitle,
  calculateStats,
  EQUIPMENT,
  BADGES,
  GameStats,
} from "@/lib/gamification";

interface ProfilePageProps {
  onClose: () => void;
}

export default function ProfilePage({ onClose }: ProfilePageProps) {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [currentBadges, setCurrentBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const houseId = useContext(HouseIdContext);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const owner = user.displayName || user.email || "user";
      const s = await getStats(owner);
      setStats(s);

      // Load badges from gamification doc
      const ref = doc(db, "gamification", owner);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCurrentBadges(snap.data().badges || []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 z-50 flex items-center justify-center">
        <div className="animate-pulse text-4xl">⚔️</div>
      </div>
    );
  }

  const { level, xpInLevel, xpForNext } = getLevel(stats.points);
  const title = getTitle(level);
  const rpgStats = calculateStats(stats);
  const userName = user?.displayName || user?.email?.split("@")[0] || "Herói";

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 z-50 overflow-y-auto animate-fade-in-up">
      {/* Header */}
      <div className="relative pt-6 pb-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-400 hover:text-purple-200 text-sm transition-colors"
        >
          ✕
        </button>

        {/* Avatar */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/30 border-2 border-amber-300/50">
          🧙
        </div>

        {/* Name + Title */}
        <h2 className="mt-3 text-xl font-bold text-white">{userName}</h2>
        <p className="text-amber-400 text-sm font-medium">{title}</p>

        {/* Level + XP Bar */}
        <div className="mt-3 mx-auto max-w-[200px]">
          <div className="flex justify-between text-[10px] text-purple-300 mb-1">
            <span>Nível {level}</span>
            <span>{xpInLevel}/{xpForNext} XP</span>
          </div>
          <div className="h-2.5 rounded-full bg-purple-900/60 border border-purple-700/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${(xpInLevel / xpForNext) * 100}%` }}
            />
          </div>
        </div>

        {/* Points */}
        <p className="mt-2 text-purple-300 text-xs">{stats.points} pontos totais</p>
      </div>

      {/* Stats */}
      <div className="px-5 mt-2">
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Atributos</h3>
        <div className="space-y-2">
          {rpgStats.map((stat) => (
            <div key={stat.key} className="flex items-center gap-2">
              <span className="text-lg w-7 text-center">{stat.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-purple-200 font-medium">{stat.name}</span>
                  <span className="text-purple-400">{stat.value}/{stat.maxValue}</span>
                </div>
                <div className="h-2 rounded-full bg-purple-900/60 border border-purple-800/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(stat.value / stat.maxValue) * 100}%`,
                      background: getStatColor(stat.key),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="px-5 mt-5">
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Equipamento</h3>
        <div className="grid grid-cols-3 gap-2">
          {EQUIPMENT.map((eq) => {
            const unlocked = eq.condition(stats, level);
            return (
              <div
                key={eq.slot}
                className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                  unlocked
                    ? "bg-purple-800/40 border-amber-500/40 shadow-sm shadow-amber-500/10"
                    : "bg-purple-950/40 border-purple-800/30 opacity-60"
                }`}
              >
                <span className="text-2xl">{unlocked ? eq.emoji : eq.lockedEmoji}</span>
                <span className="text-[10px] text-purple-200 mt-1 text-center leading-tight font-medium">
                  {unlocked ? eq.name : "???"}
                </span>
                <span className="text-[9px] text-purple-400 mt-0.5 text-center leading-tight">
                  {eq.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="px-5 mt-5 pb-8">
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Conquistas</h3>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((badge) => {
            const earned = currentBadges.includes(badge.id) || badge.condition(stats);
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center p-2.5 rounded-xl border transition-all ${
                  earned
                    ? "bg-purple-800/40 border-amber-500/30"
                    : "bg-purple-950/40 border-purple-800/30 opacity-50"
                }`}
              >
                <span className="text-xl">{earned ? badge.emoji : "🔒"}</span>
                <span className="text-[10px] text-purple-200 mt-1 font-medium text-center">
                  {badge.name}
                </span>
                <span className="text-[9px] text-purple-400 text-center">{badge.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getStatColor(key: string): string {
  const colors: Record<string, string> = {
    str: "linear-gradient(to right, #ef4444, #f97316)",
    int: "linear-gradient(to right, #3b82f6, #8b5cf6)",
    dex: "linear-gradient(to right, #10b981, #34d399)",
    cha: "linear-gradient(to right, #f59e0b, #fbbf24)",
    vit: "linear-gradient(to right, #ec4899, #f43f5e)",
    lck: "linear-gradient(to right, #06b6d4, #22d3ee)",
  };
  return colors[key] || "linear-gradient(to right, #8b5cf6, #a855f7)";
}
