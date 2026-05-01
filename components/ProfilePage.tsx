"use client";

import { useState, useEffect, useContext } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
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
  Equipment,
  getPendingBoxes,
  openLootBox,
  equipItem,
  unequipItem,
  type InventoryItem,
  type EquippedItems,
  type LootSlot,
} from "@/lib/gamification";
import CharacterModel from "./CharacterModel";
import Inventory from "./Inventory";
import LootBoxOpener from "./LootBoxOpener";

interface ProfilePageProps {
  onClose: () => void;
}

export default function ProfilePage({ onClose }: ProfilePageProps) {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [currentBadges, setCurrentBadges] = useState<string[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equipped, setEquipped] = useState<EquippedItems>({});
  const [boxesOpened, setBoxesOpened] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "inventory" | "settings">("stats");
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
        setInventory(snap.data().inventory || []);
        setEquipped(snap.data().equipped || {});
        setBoxesOpened(snap.data().boxesOpened || 0);
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

        {/* Character Model */}
        <div className="flex justify-center">
          <CharacterModel equipped={equipped} size="sm" />
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

        {/* Tab switcher */}
        <div className="flex gap-2 justify-center mt-4">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              activeTab === "stats"
                ? "bg-purple-600/60 text-white border border-purple-400/40"
                : "bg-purple-900/40 text-purple-400 border border-purple-700/30 hover:bg-purple-800/40"
            }`}
          >
            ⚔️ Stats
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              activeTab === "inventory"
                ? "bg-purple-600/60 text-white border border-purple-400/40"
                : "bg-purple-900/40 text-purple-400 border border-purple-700/30 hover:bg-purple-800/40"
            }`}
          >
            🎒 Inventário
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              activeTab === "settings"
                ? "bg-purple-600/60 text-white border border-purple-400/40"
                : "bg-purple-900/40 text-purple-400 border border-purple-700/30 hover:bg-purple-800/40"
            }`}
          >
            ⚙️ Perfil
          </button>
        </div>
      </div>

      {activeTab === "stats" ? (
        <StatsTab stats={stats} rpgStats={rpgStats} level={level} currentBadges={currentBadges} />
      ) : activeTab === "inventory" ? (
        <InventoryTab
          inventory={inventory}
          equipped={equipped}
          stats={stats}
          boxesOpened={boxesOpened}
          user={user}
          onUpdate={() => {
            // Reload data
            const owner = user?.displayName || user?.email || "user";
            const ref = doc(db, "gamification", owner);
            getDoc(ref).then((snap) => {
              if (snap.exists()) {
                setInventory(snap.data().inventory || []);
                setEquipped(snap.data().equipped || {});
                setBoxesOpened(snap.data().boxesOpened || 0);
              }
            });
          }}
        />
      ) : (
        <SettingsTab user={user} />
      )}
    </div>
  );
}

// ─── Inventory Tab ────────────────────────────────────────────

import type { RPGStat } from "@/lib/gamification";
import type { User } from "firebase/auth";

function InventoryTab({ inventory, equipped, stats, boxesOpened, user, onUpdate }: {
  inventory: InventoryItem[];
  equipped: EquippedItems;
  stats: GameStats;
  boxesOpened: number;
  user: User | null;
  onUpdate: () => void;
}) {
  const owner = user?.displayName || user?.email || "user";
  const pending = getPendingBoxes(stats.points, boxesOpened);

  const handleOpen = async () => {
    const item = await openLootBox(owner);
    onUpdate();
    return item;
  };

  const handleEquip = async (itemId: string, slot: LootSlot) => {
    await equipItem(owner, itemId, slot);
    onUpdate();
  };

  const handleUnequip = async (slot: LootSlot) => {
    await unequipItem(owner, slot);
    onUpdate();
  };

  return (
    <div className="mt-2 pb-8">
      {/* Loot Box Opener */}
      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-b from-purple-900/40 to-indigo-950/40 border border-purple-700/30 p-3">
        <LootBoxOpener pendingBoxes={pending} onOpen={handleOpen} />
      </div>

      {/* Inventory Grid */}
      <Inventory
        inventory={inventory}
        equipped={equipped}
        onEquip={handleEquip}
        onUnequip={handleUnequip}
      />
    </div>
  );
}

// ─── Stats Tab ─────────────────────────────────────────────────

function StatsTab({ stats, rpgStats, level, currentBadges }: { stats: GameStats; rpgStats: RPGStat[]; level: number; currentBadges: string[] }) {
  return (
    <>
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

      {/* Equipment - WoW Style Paper Doll */}
      <div className="px-5 mt-5">
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Equipamento</h3>
        <div className="relative bg-gradient-to-b from-indigo-950/60 to-purple-950/60 rounded-2xl border border-pink-300/20 p-4 shadow-inner shadow-purple-900/30">
          <div className="grid grid-cols-5 grid-rows-4 gap-1.5 items-center justify-items-center min-h-[220px]">
            <div className="col-start-3 row-start-1">
              <EquipSlot eq={EQUIPMENT.find((e) => e.slot === "crown")!} unlocked={EQUIPMENT.find((e) => e.slot === "crown")!.condition(stats, level)} rarity="legendary" />
            </div>
            <div className="col-start-1 row-start-2">
              <EquipSlot eq={EQUIPMENT.find((e) => e.slot === "weapon")!} unlocked={EQUIPMENT.find((e) => e.slot === "weapon")!.condition(stats, level)} rarity="epic" />
            </div>
            <div className="col-start-2 col-span-3 row-start-2 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-300/30 to-purple-400/30 border-2 border-pink-300/40 flex items-center justify-center text-4xl shadow-lg shadow-pink-500/20 animate-float">
                🧙
              </div>
            </div>
            <div className="col-start-5 row-start-2">
              <EquipSlot eq={EQUIPMENT.find((e) => e.slot === "shield")!} unlocked={EQUIPMENT.find((e) => e.slot === "shield")!.condition(stats, level)} rarity="rare" />
            </div>
            <div className="col-start-1 row-start-3">
              <EquipSlot eq={EQUIPMENT.find((e) => e.slot === "gloves")!} unlocked={EQUIPMENT.find((e) => e.slot === "gloves")!.condition(stats, level)} rarity="epic" />
            </div>
            <div className="col-start-5 row-start-3">
              <EquipSlot eq={EQUIPMENT.find((e) => e.slot === "ring")!} unlocked={EQUIPMENT.find((e) => e.slot === "ring")!.condition(stats, level)} rarity="rare" />
            </div>
            <div className="col-start-3 row-start-4">
              <EquipSlot eq={EQUIPMENT.find((e) => e.slot === "boots")!} unlocked={EQUIPMENT.find((e) => e.slot === "boots")!.condition(stats, level)} rarity="common" />
            </div>
          </div>
          <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-pink-400/30 rounded-tl" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-pink-400/30 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-pink-400/30 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-pink-400/30 rounded-br" />
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
                    ? "bg-purple-800/40 border-amber-500/30 animate-spring-in"
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
    </>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────

const AVATAR_OPTIONS = ["🧙", "🦸", "🧝", "🧚", "🦊", "🐱", "🐶", "🦄", "🐉", "🌸", "🌺", "💫", "⭐", "🔮", "🎭", "👑"];

function SettingsTab({ user }: { user: User | null }) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [selectedAvatar, setSelectedAvatar] = useState("🧙");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, "users", user.uid), { name: displayName, avatar: selectedAvatar });
      setStatus("✨ Perfil atualizado!");
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus(`❌ Erro: ${e}`);
    }
    setSaving(false);
  };

  const handleChangeEmail = async () => {
    if (!user || !newEmail) return;
    setSaving(true);
    try {
      await updateEmail(user, newEmail);
      setStatus("✨ Email atualizado!");
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus(`❌ Erro: ${e}`);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!user || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setStatus("❌ Passwords não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("❌ Password deve ter pelo menos 6 caracteres");
      return;
    }
    setSaving(true);
    try {
      await updatePassword(user, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setStatus("✨ Password atualizada!");
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus(`❌ Erro: ${e}`);
    }
    setSaving(false);
  };

  return (
    <div className="px-5 mt-2 pb-8 space-y-5">
      {/* Avatar selector */}
      <div>
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Avatar</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {AVATAR_OPTIONS.map((av) => (
            <button
              key={av}
              onClick={() => setSelectedAvatar(av)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90 ${
                selectedAvatar === av
                  ? "bg-purple-600/60 border-2 border-amber-400/60 scale-110 shadow-md shadow-amber-400/20"
                  : "bg-purple-900/40 border border-purple-700/30 hover:bg-purple-800/40"
              }`}
            >
              {av}
            </button>
          ))}
        </div>
      </div>

      {/* Display name */}
      <div>
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Nome</h3>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-xl bg-purple-900/40 border border-purple-700/30 px-4 py-2.5 text-sm text-white placeholder-purple-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all"
          placeholder="O teu nome..."
        />
      </div>

      <button
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-purple-500/20"
      >
        {saving ? "A guardar..." : "Guardar perfil"}
      </button>

      {/* Email */}
      <div>
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Email</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 rounded-xl bg-purple-900/40 border border-purple-700/30 px-4 py-2.5 text-sm text-white placeholder-purple-500 focus:outline-none focus:border-purple-500 transition-all"
            placeholder="novo@email.com"
          />
          <button
            onClick={handleChangeEmail}
            disabled={saving || newEmail === user?.email}
            className="px-4 rounded-xl bg-purple-700/50 text-purple-200 text-sm font-medium hover:bg-purple-600/50 disabled:opacity-30 transition-all active:scale-95"
          >
            Alterar
          </button>
        </div>
      </div>

      {/* Password */}
      <div>
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Nova Password</h3>
        <div className="space-y-2">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl bg-purple-900/40 border border-purple-700/30 px-4 py-2.5 text-sm text-white placeholder-purple-500 focus:outline-none focus:border-purple-500 transition-all"
            placeholder="Nova password..."
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl bg-purple-900/40 border border-purple-700/30 px-4 py-2.5 text-sm text-white placeholder-purple-500 focus:outline-none focus:border-purple-500 transition-all"
            placeholder="Confirmar password..."
          />
          <button
            onClick={handleChangePassword}
            disabled={saving || !newPassword}
            className="w-full rounded-xl bg-purple-700/50 text-purple-200 py-2.5 text-sm font-medium hover:bg-purple-600/50 disabled:opacity-30 transition-all active:scale-95"
          >
            Alterar password
          </button>
        </div>
      </div>

      {/* Status message */}
      {status && (
        <p className="text-sm text-center text-amber-300 animate-spring-in">{status}</p>
      )}

      {/* Account info */}
      <div className="pt-2 border-t border-purple-800/30">
        <p className="text-[11px] text-purple-500 text-center">
          Conta: {user?.email} | UID: {user?.uid?.slice(0, 8)}...
        </p>
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

const RARITY_COLORS: Record<string, { border: string; glow: string; text: string }> = {
  common: { border: "border-green-400/60", glow: "shadow-green-400/20", text: "text-green-300" },
  rare: { border: "border-blue-400/60", glow: "shadow-blue-400/20", text: "text-blue-300" },
  epic: { border: "border-purple-400/60", glow: "shadow-purple-400/30", text: "text-purple-300" },
  legendary: { border: "border-amber-400/60", glow: "shadow-amber-400/30", text: "text-amber-300" },
};

function EquipSlot({ eq, unlocked, rarity }: { eq: Equipment; unlocked: boolean; rarity: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90 border-2 ${
          unlocked
            ? `bg-gradient-to-br from-slate-800/80 to-purple-900/80 ${colors.border} shadow-md ${colors.glow}`
            : "bg-slate-900/60 border-slate-700/40 opacity-50"
        }`}
      >
        {unlocked ? eq.emoji : (
          <span className="text-slate-600 text-sm">✦</span>
        )}
      </button>

      {/* WoW-style tooltip */}
      {showTooltip && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-600/60 rounded-lg p-2.5 shadow-xl"
          onClick={() => setShowTooltip(false)}
        >
          <p className={`text-[11px] font-bold ${unlocked ? colors.text : "text-slate-400"} leading-tight`}>
            {unlocked ? eq.name : "???"}
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5 capitalize">{eq.slot}</p>
          <div className="border-t border-slate-700/50 my-1.5" />
          <p className="text-[9px] text-amber-200/80 leading-tight">
            {unlocked ? "✨ Equipado" : `🔒 ${eq.description}`}
          </p>
          <p className={`text-[9px] mt-1 capitalize ${colors.text}`}>
            {rarity}
          </p>
          {/* Little arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-600/60" />
        </div>
      )}
    </div>
  );
}
