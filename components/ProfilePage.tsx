"use client";

import { useState, useEffect, useContext } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { HouseIdContext } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import {
  getStats,
  getLevel,
  getTitle,
  calculateStats,
  BADGES,
  GameStats,
  getPendingBoxes,
  openLootBox,
  equipItem,
  unequipItem,
  LOOT_POOL,
  type InventoryItem,
  type EquippedItems,
  type LootSlot,
} from "@/lib/gamification";
import CharacterModel from "./CharacterModel";
import Inventory from "./Inventory";
import LootBoxOpener from "./LootBoxOpener";
import AvatarBuilder, { AnimeAnimalCharacter, type AvatarConfig } from "./AvatarBuilder";

interface ProfilePageProps {
  onClose: () => void;
}

export default function ProfilePage({ onClose }: ProfilePageProps) {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [currentBadges, setCurrentBadges] = useState<string[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equipped, setEquipped] = useState<EquippedItems>({});
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [boxesOpened, setBoxesOpened] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "inventory" | "avatar" | "settings">("stats");
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
        if (snap.data().avatar) setAvatarConfig(snap.data().avatar);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 z-50 flex items-center justify-center">
        <div className="animate-pulse text-4xl">⚔️</div>
      </div>
    );
  }

  const { level, xpInLevel, xpForNext } = getLevel(stats.points);
  const title = getTitle(level);
  const rpgStats = calculateStats(stats);
  const userName = user?.displayName || user?.email?.split("@")[0] || "Herói";

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 z-50 overflow-y-auto animate-fade-in-up">
      {/* Header */}
      <div className="relative pt-6 pb-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 text-sm transition-colors"
        >
          ✕
        </button>

        {/* Character Model */}
        <div className="flex justify-center">
          {avatarConfig ? (
            <AnimeAnimalCharacter config={avatarConfig} size={96} />
          ) : (
            <CharacterModel equipped={equipped} size="sm" />
          )}
        </div>

        {/* Name + Title */}
        <h2 className="mt-3 text-xl font-bold text-rose-800">{userName}</h2>
        <p className="text-purple-600 text-sm font-medium">{title}</p>

        {/* Level + XP Bar */}
        <div className="mt-3 mx-auto max-w-[200px]">
          <div className="flex justify-between text-[10px] text-purple-600 mb-1">
            <span>Nível {level}</span>
            <span>{xpInLevel}/{xpForNext} XP</span>
          </div>
          <div className="h-2.5 rounded-full bg-purple-200/60 border border-purple-300/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${(xpInLevel / xpForNext) * 100}%` }}
            />
          </div>
        </div>

        {/* Points */}
        <p className="mt-2 text-purple-600 text-xs">{stats.points} pontos totais</p>

        {/* Tab switcher */}
        <div className="flex gap-2 justify-center mt-4">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              activeTab === "stats"
                ? "bg-rose-500/80 text-white border border-rose-400/40 shadow-sm"
                : "bg-white/60 text-purple-600 border border-purple-200/60 hover:bg-white/80"
            }`}
          >
            ⚔️ Stats
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              activeTab === "inventory"
                ? "bg-rose-500/80 text-white border border-rose-400/40 shadow-sm"
                : "bg-white/60 text-purple-600 border border-purple-200/60 hover:bg-white/80"
            }`}
          >
            🎒 Inventário
          </button>
          <button
            onClick={() => setActiveTab("avatar")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              activeTab === "avatar"
                ? "bg-rose-500/80 text-white border border-rose-400/40 shadow-sm"
                : "bg-white/60 text-purple-600 border border-purple-200/60 hover:bg-white/80"
            }`}
          >
            🐼 Avatar
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              activeTab === "settings"
                ? "bg-rose-500/80 text-white border border-rose-400/40 shadow-sm"
                : "bg-white/60 text-purple-600 border border-purple-200/60 hover:bg-white/80"
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
          level={level}
          onUpdate={() => {
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
      ) : activeTab === "avatar" ? (
        <AvatarBuilder owner={user?.displayName || user?.email || "user"} onSave={(config) => setAvatarConfig(config)} />
      ) : (
        <SettingsTab user={user} />
      )}
    </div>
  );
}

// ─── Inventory Tab ────────────────────────────────────────────

import type { RPGStat } from "@/lib/gamification";
import type { User } from "firebase/auth";

function InventoryTab({ inventory, equipped, stats, boxesOpened, user, onUpdate, level }: {
  inventory: InventoryItem[];
  equipped: EquippedItems;
  stats: GameStats;
  boxesOpened: number;
  user: User | null;
  onUpdate: () => void;
  level: number;
}) {
  const owner = user?.displayName || user?.email || "user";
  const pending = getPendingBoxes(stats.points, boxesOpened);

  const handleOpen = async () => {
    const result = await openLootBox(owner);
    onUpdate();
    return result;
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
      <div className="mx-4 mb-3 rounded-2xl bg-gradient-to-b from-white/70 to-purple-50/70 border border-purple-200/40 p-3 shadow-sm">
        <LootBoxOpener pendingBoxes={pending} onOpen={handleOpen} />
      </div>

      {/* Equipment - Character Panel */}
      <div className="px-3 mb-4">
        <div className="relative rounded-xl overflow-hidden border-2 border-rose-200/60 shadow-lg shadow-rose-100/30">
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-pink-50/80 to-purple-50/80" />

          <div className="relative px-3 py-2 bg-gradient-to-r from-rose-100/60 via-pink-100/40 to-rose-100/60 border-b border-rose-200/40">
            <p className="text-center text-rose-600 text-[11px] font-bold tracking-wide uppercase">Equipamento</p>
          </div>

          <div className="relative px-2 py-4">
            <div className="flex items-stretch justify-between gap-1">
              <div className="flex flex-col gap-2 justify-center items-center">
                <LootEquipSlot slot="helmet" equipped={equipped} label="Cabeça" onUnequip={handleUnequip} onEquip={handleEquip} />
                <LootEquipSlot slot="weapon" equipped={equipped} label="Arma" onUnequip={handleUnequip} onEquip={handleEquip} />
                <LootEquipSlot slot="armor" equipped={equipped} label="Corpo" onUnequip={handleUnequip} onEquip={handleEquip} />
              </div>

              <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
                <div className="relative">
                  <div className="absolute inset-0 blur-xl bg-rose-200/20 rounded-full scale-150" />
                  <CharacterModel equipped={equipped} size="md" />
                </div>
              </div>

              <div className="flex flex-col gap-2 justify-center items-center">
                <LootEquipSlot slot="shield" equipped={equipped} label="Escudo" onUnequip={handleUnequip} onEquip={handleEquip} />
                <LootEquipSlot slot="boots" equipped={equipped} label="Botas" onUnequip={handleUnequip} onEquip={handleEquip} />
                <LootEquipSlot slot="accessory" equipped={equipped} label="Acess." onUnequip={handleUnequip} onEquip={handleEquip} />
              </div>
            </div>
          </div>

          <div className="relative px-3 py-2 bg-gradient-to-r from-rose-100/30 via-purple-100/30 to-rose-100/30 border-t border-rose-200/30">
            <div className="flex justify-around text-[9px] text-purple-600">
              <span>Nv. {level}</span>
              <span>{stats.points} pts</span>
              <span>{stats.totalCompleted} feitos</span>
            </div>
          </div>

          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-rose-300/50 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-rose-300/50 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-rose-300/50 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-rose-300/50 rounded-br-lg" />
        </div>
      </div>

      {/* Inventory Grid — drag items to slots above */}
      <div className="px-4">
        <p className="text-[10px] text-purple-500 text-center mb-2">Arrasta items para os slots acima ou toca para equipar</p>
      </div>
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
        <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Atributos</h3>
        <div className="space-y-2">
          {rpgStats.map((stat) => (
            <div key={stat.key} className="flex items-center gap-2">
              <span className="text-lg w-7 text-center">{stat.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-rose-700 font-medium">{stat.name}</span>
                  <span className="text-purple-600">{stat.value}/{stat.maxValue}</span>
                </div>
                <div className="h-2 rounded-full bg-purple-200/60 border border-purple-200/40 overflow-hidden">
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

      {/* Badges */}
      <div className="px-5 mt-5 pb-8">
        <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Conquistas</h3>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((badge) => {
            const earned = currentBadges.includes(badge.id) || badge.condition(stats);
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center p-2.5 rounded-xl border transition-all ${
                  earned
                    ? "bg-white/80 border-rose-300/50 shadow-sm animate-spring-in"
                    : "bg-white/40 border-purple-200/30 opacity-50"
                }`}
              >
                <span className="text-xl">{earned ? badge.emoji : "🔒"}</span>
                <span className="text-[10px] text-rose-700 mt-1 font-medium text-center">
                  {badge.name}
                </span>
                <span className="text-[9px] text-purple-500 text-center">{badge.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────

function SettingsTab({ user }: { user: User | null }) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
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
      await updateDoc(doc(db, "users", user.uid), { name: displayName });
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
      {/* Display name */}
      <div>
        <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Nome</h3>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-xl bg-white/70 border border-purple-200/40 px-4 py-2.5 text-sm text-rose-800 placeholder-purple-400 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30 transition-all"
          placeholder="O teu nome..."
        />
      </div>

      <button
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-rose-400/20"
      >
        {saving ? "A guardar..." : "Guardar perfil"}
      </button>

      {/* Email */}
      <div>
        <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Email</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 rounded-xl bg-white/70 border border-purple-200/40 px-4 py-2.5 text-sm text-rose-800 placeholder-purple-400 focus:outline-none focus:border-rose-400 transition-all"
            placeholder="novo@email.com"
          />
          <button
            onClick={handleChangeEmail}
            disabled={saving || newEmail === user?.email}
            className="px-4 rounded-xl bg-rose-100 text-rose-600 text-sm font-medium hover:bg-rose-200 disabled:opacity-30 transition-all active:scale-95"
          >
            Alterar
          </button>
        </div>
      </div>

      {/* Password */}
      <div>
        <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Nova Password</h3>
        <div className="space-y-2">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl bg-white/70 border border-purple-200/40 px-4 py-2.5 text-sm text-rose-800 placeholder-purple-400 focus:outline-none focus:border-rose-400 transition-all"
            placeholder="Nova password..."
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl bg-white/70 border border-purple-200/40 px-4 py-2.5 text-sm text-rose-800 placeholder-purple-400 focus:outline-none focus:border-rose-400 transition-all"
            placeholder="Confirmar password..."
          />
          <button
            onClick={handleChangePassword}
            disabled={saving || !newPassword}
            className="w-full rounded-xl bg-rose-100 text-rose-600 py-2.5 text-sm font-medium hover:bg-rose-200 disabled:opacity-30 transition-all active:scale-95"
          >
            Alterar password
          </button>
        </div>
      </div>

      {/* Status message */}
      {status && (
        <p className="text-sm text-center text-rose-600 animate-spring-in">{status}</p>
      )}

      {/* Account info */}
      <div className="pt-2 border-t border-purple-200/40">
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

// Loot-based equipment slot — shows the equipped loot item from inventory, accepts drag
function LootEquipSlot({ slot, equipped, label, onUnequip, onEquip }: { slot: LootSlot; equipped: EquippedItems; label: string; onUnequip: (slot: LootSlot) => void; onEquip: (itemId: string, slot: LootSlot) => void }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const itemId = equipped[slot];
  const item = itemId ? LOOT_POOL.find((i) => i.id === itemId) : null;

  const rarityBorder = item
    ? { common: "border-[#1eff00]/50", rare: "border-[#0070dd]/50", epic: "border-[#a335ee]/50", legendary: "border-[#ff8000]/50" }[item.rarity] || ""
    : "";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedItemId = e.dataTransfer.types.includes("text/plain") ? true : false;
    if (draggedItemId) setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const draggedItemId = e.dataTransfer.getData("text/plain");
    const draggedItem = LOOT_POOL.find((i) => i.id === draggedItemId);
    if (draggedItem && draggedItem.slot === slot) {
      onEquip(draggedItemId, slot);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <div
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <button
          onClick={() => item ? setShowTooltip(!showTooltip) : null}
          className={`w-[46px] h-[46px] rounded-lg flex items-center justify-center text-xl transition-all active:scale-90 border-2 shadow-sm ${
            dragOver ? "border-rose-400/80 scale-110" : item ? rarityBorder : "border-purple-200/50"
          } ${
            item
              ? "bg-gradient-to-b from-white to-purple-50 hover:from-purple-50 hover:to-purple-100"
              : "bg-gradient-to-b from-white/80 to-pink-50/60"
          }`}
          style={{
            boxShadow: item
              ? `0 2px 6px ${item.rarity === "legendary" ? "rgba(255,128,0,0.15)" : item.rarity === "epic" ? "rgba(163,53,238,0.15)" : item.rarity === "rare" ? "rgba(0,112,221,0.1)" : "rgba(30,200,0,0.08)"}`
              : "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {item ? (
            <span className="drop-shadow-sm">{item.emoji}</span>
          ) : (
            <span className="text-purple-300/50 text-xs">✦</span>
          )}
        </button>
      </div>
      <span className="text-[8px] text-rose-400/70 mt-0.5 font-medium">{label}</span>

      {/* Tooltip */}
      {showTooltip && item && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 rounded-md p-2.5 shadow-lg"
          style={{
            background: "linear-gradient(to bottom, #ffffff, #fdf2f8)",
            border: "1px solid rgba(236, 72, 153, 0.2)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
          onClick={() => setShowTooltip(false)}
        >
          <p className={`text-[11px] font-bold leading-tight ${
            item.rarity === "legendary" ? "text-[#ff8000]" : item.rarity === "epic" ? "text-[#a335ee]" : item.rarity === "rare" ? "text-[#0070dd]" : "text-[#1eff00]"
          }`}>
            {item.name}
          </p>
          <p className="text-[9px] text-purple-500/70 mt-0.5">{item.description}</p>
          <div className="border-t border-rose-200/40 my-1.5" />
          <p className={`text-[9px] capitalize font-medium ${
            item.rarity === "legendary" ? "text-[#ff8000]" : item.rarity === "epic" ? "text-[#a335ee]" : item.rarity === "rare" ? "text-[#0070dd]" : "text-[#1eff00]"
          }`}>
            {item.rarity === "legendary" ? "Lendário" : item.rarity === "epic" ? "Épico" : item.rarity === "rare" ? "Raro" : "Comum"}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onUnequip(slot); setShowTooltip(false); }}
            className="mt-1.5 w-full text-[9px] py-1 rounded bg-red-50 text-red-500 border border-red-200/50 hover:bg-red-100 transition-all"
          >
            Desequipar
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-pink-200/40" />
        </div>
      )}
    </div>
  );
}