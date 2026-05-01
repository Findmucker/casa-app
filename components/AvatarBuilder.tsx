"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Avatar Parts Database ────────────────────────────────────

export type AvatarSlot = "head" | "torso" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

export interface AvatarPart {
  id: string;
  animal: string;
  slot: AvatarSlot;
  emoji: string;
  color: string; // tailwind gradient
  label: string;
}

export interface AvatarConfig {
  head: string;
  torso: string;
  leftArm: string;
  rightArm: string;
  leftLeg: string;
  rightLeg: string;
}

const ANIMALS = [
  { id: "panda", name: "Panda", emoji: "🐼", primary: "#1a1a2e", secondary: "#ffffff" },
  { id: "cat", name: "Gatinho", emoji: "🐱", primary: "#f97316", secondary: "#fed7aa" },
  { id: "bunny", name: "Coelhinho", emoji: "🐰", primary: "#fde8e8", secondary: "#ffffff" },
  { id: "bear", name: "Ursinho", emoji: "🐻", primary: "#92400e", secondary: "#d97706" },
  { id: "fox", name: "Raposa", emoji: "🦊", primary: "#ea580c", secondary: "#ffffff" },
  { id: "dog", name: "Cãozinho", emoji: "🐶", primary: "#a16207", secondary: "#fef3c7" },
  { id: "penguin", name: "Pinguim", emoji: "🐧", primary: "#1e293b", secondary: "#ffffff" },
  { id: "koala", name: "Coala", emoji: "🐨", primary: "#6b7280", secondary: "#e5e7eb" },
  { id: "hamster", name: "Hamster", emoji: "🐹", primary: "#f59e0b", secondary: "#ffffff" },
  { id: "owl", name: "Coruja", emoji: "🦉", primary: "#78350f", secondary: "#d97706" },
  { id: "frog", name: "Sapinho", emoji: "🐸", primary: "#16a34a", secondary: "#bbf7d0" },
];

// Generate parts for each animal and slot
function generateParts(): AvatarPart[] {
  const parts: AvatarPart[] = [];
  const slots: AvatarSlot[] = ["head", "torso", "leftArm", "rightArm", "leftLeg", "rightLeg"];
  const slotLabels: Record<AvatarSlot, string> = {
    head: "Cabeça", torso: "Corpo", leftArm: "Braço E.", rightArm: "Braço D.", leftLeg: "Perna E.", rightLeg: "Perna D.",
  };

  for (const animal of ANIMALS) {
    for (const slot of slots) {
      parts.push({
        id: `${animal.id}_${slot}`,
        animal: animal.id,
        slot,
        emoji: animal.emoji,
        color: animal.primary,
        label: `${slotLabels[slot]} de ${animal.name}`,
      });
    }
  }
  return parts;
}

const ALL_PARTS = generateParts();

const DEFAULT_AVATAR: AvatarConfig = {
  head: "panda_head",
  torso: "panda_torso",
  leftArm: "panda_leftArm",
  rightArm: "panda_rightArm",
  leftLeg: "panda_leftLeg",
  rightLeg: "panda_rightLeg",
};

const SLOT_INFO: { key: AvatarSlot; label: string; emoji: string }[] = [
  { key: "head", label: "Cabeça", emoji: "🗣️" },
  { key: "torso", label: "Corpo", emoji: "👕" },
  { key: "leftArm", label: "Braço E.", emoji: "💪" },
  { key: "rightArm", label: "Braço D.", emoji: "🤚" },
  { key: "leftLeg", label: "Perna E.", emoji: "🦵" },
  { key: "rightLeg", label: "Perna D.", emoji: "🦶" },
];

// ─── Component ────────────────────────────────────────────────

interface AvatarBuilderProps {
  owner: string;
}

export default function AvatarBuilder({ owner }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [activeSlot, setActiveSlot] = useState<AvatarSlot>("head");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "gamification", owner);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().avatar) {
        setConfig(snap.data().avatar);
      }
      setLoaded(true);
    };
    load();
  }, [owner]);

  const handleSelectPart = (partId: string) => {
    setConfig((prev) => ({ ...prev, [activeSlot]: partId }));
  };

  const handleSave = async () => {
    setSaving(true);
    const ref = doc(db, "gamification", owner);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { avatar: config });
    } else {
      await setDoc(ref, { avatar: config }, { merge: true });
    }
    setSaving(false);
  };

  const getAnimalForPart = (partId: string) => {
    return ANIMALS.find((a) => partId.startsWith(a.id));
  };

  if (!loaded) return <div className="text-center py-8 text-purple-400 animate-pulse">A carregar...</div>;

  const partsForSlot = ALL_PARTS.filter((p) => p.slot === activeSlot);

  return (
    <div className="mt-2 pb-8 px-4">
      {/* 3D Avatar Preview */}
      <div className="relative mx-auto w-48 h-56 mb-4">
        <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "500px" }}>
          <div className="relative animate-breathe" style={{ transformStyle: "preserve-3d" }}>
            {/* Head */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "0px" }}>
              <AvatarPartView partId={config.head} slot="head" />
            </div>
            {/* Torso */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "65px" }}>
              <AvatarPartView partId={config.torso} slot="torso" />
            </div>
            {/* Left Arm */}
            <div className="absolute" style={{ top: "70px", left: "10px" }}>
              <AvatarPartView partId={config.leftArm} slot="leftArm" />
            </div>
            {/* Right Arm */}
            <div className="absolute" style={{ top: "70px", right: "10px" }}>
              <AvatarPartView partId={config.rightArm} slot="rightArm" />
            </div>
            {/* Left Leg */}
            <div className="absolute" style={{ top: "135px", left: "55px" }}>
              <AvatarPartView partId={config.leftLeg} slot="leftLeg" />
            </div>
            {/* Right Leg */}
            <div className="absolute" style={{ top: "135px", right: "55px" }}>
              <AvatarPartView partId={config.rightLeg} slot="rightLeg" />
            </div>
          </div>
        </div>
      </div>

      {/* Slot selector */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 mb-3 justify-center">
        {SLOT_INFO.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSlot(s.key)}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 ${
              activeSlot === s.key
                ? "bg-amber-500/30 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-400/10"
                : "bg-purple-900/40 text-purple-400 border border-purple-700/30"
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Animal parts grid for selected slot */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {partsForSlot.map((part) => {
          const animal = getAnimalForPart(part.id);
          const isSelected = config[activeSlot] === part.id;
          return (
            <button
              key={part.id}
              onClick={() => handleSelectPart(part.id)}
              className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all active:scale-90 ${
                isSelected
                  ? "border-amber-400/60 bg-amber-900/20 shadow-md shadow-amber-400/10 scale-105"
                  : "border-purple-700/30 bg-purple-900/30 hover:border-purple-500/40"
              }`}
            >
              <span className="text-2xl">{animal?.emoji}</span>
              <span className="text-[8px] text-purple-300 mt-1 text-center leading-tight">{animal?.name}</span>
            </button>
          );
        })}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-amber-500/20"
      >
        {saving ? "A guardar..." : "Guardar Avatar"}
      </button>
    </div>
  );
}

// ─── Avatar Part Renderer ─────────────────────────────────────

function AvatarPartView({ partId, slot }: { partId: string; slot: AvatarSlot }) {
  const animal = ANIMALS.find((a) => partId.startsWith(a.id));
  if (!animal) return null;

  const sizes: Record<AvatarSlot, { w: number; h: number; radius: string }> = {
    head: { w: 52, h: 52, radius: "50%" },
    torso: { w: 44, h: 56, radius: "35%" },
    leftArm: { w: 16, h: 40, radius: "40%" },
    rightArm: { w: 16, h: 40, radius: "40%" },
    leftLeg: { w: 18, h: 36, radius: "30%" },
    rightLeg: { w: 18, h: 36, radius: "30%" },
  };

  const { w, h, radius } = sizes[slot];

  return (
    <div
      className="border-2 shadow-md flex items-center justify-center transition-all"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${animal.primary}, ${animal.secondary})`,
        borderColor: `${animal.primary}88`,
      }}
    >
      {slot === "head" && (
        <div className="flex flex-col items-center">
          {/* Eyes */}
          <div className="flex gap-2 mb-0.5">
            <div className="w-2 h-2.5 rounded-full bg-slate-900" />
            <div className="w-2 h-2.5 rounded-full bg-slate-900" />
          </div>
          {/* Nose/mouth */}
          <div className="w-2 h-1.5 rounded-full bg-pink-300" />
        </div>
      )}
      {slot === "torso" && (
        <div className="w-6 h-8 rounded-[30%] opacity-30" style={{ background: animal.secondary }} />
      )}
    </div>
  );
}

export { ANIMALS };
