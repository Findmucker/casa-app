"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Anime Avatar System ──────────────────────────────────────

export type AvatarSlot = "hair" | "eyes" | "mouth" | "skin" | "outfit" | "accessory";

export interface AvatarConfig {
  hair: number;
  eyes: number;
  mouth: number;
  skin: number;
  outfit: number;
  accessory: number;
}

// Hair styles (anime-style descriptions for CSS rendering)
const HAIR_STYLES = [
  { id: 0, name: "Curto Fofo", color: "#1a1a2e", highlight: "#374151", style: "short" },
  { id: 1, name: "Longo Liso", color: "#7c2d12", highlight: "#dc2626", style: "long" },
  { id: 2, name: "Rabo de Cavalo", color: "#fbbf24", highlight: "#fde68a", style: "ponytail" },
  { id: 3, name: "Ondulado", color: "#ec4899", highlight: "#f9a8d4", style: "wavy" },
  { id: 4, name: "Espetado", color: "#6366f1", highlight: "#a5b4fc", style: "spiky" },
  { id: 5, name: "Bob Cut", color: "#059669", highlight: "#6ee7b7", style: "bob" },
  { id: 6, name: "Franja", color: "#f97316", highlight: "#fed7aa", style: "bangs" },
  { id: 7, name: "Twintails", color: "#8b5cf6", highlight: "#c4b5fd", style: "twintails" },
  { id: 8, name: "Panda Buns", color: "#1f2937", highlight: "#ffffff", style: "buns" },
  { id: 9, name: "Fluffy", color: "#f472b6", highlight: "#fce7f3", style: "fluffy" },
];

const EYE_STYLES = [
  { id: 0, name: "Grandes Brilhantes", color: "#3b82f6", pupil: "#1e3a5f", sparkle: true },
  { id: 1, name: "Gatinho", color: "#10b981", pupil: "#064e3b", sparkle: true },
  { id: 2, name: "Doces", color: "#a855f7", pupil: "#581c87", sparkle: true },
  { id: 3, name: "Determinados", color: "#ef4444", pupil: "#7f1d1d", sparkle: false },
  { id: 4, name: "Sonhadores", color: "#f59e0b", pupil: "#78350f", sparkle: true },
  { id: 5, name: "Fechados Feliz", color: "#000000", pupil: "#000000", sparkle: false },
  { id: 6, name: "Estrelas", color: "#ec4899", pupil: "#831843", sparkle: true },
  { id: 7, name: "Heterocromia", color: "#3b82f6", pupil: "#10b981", sparkle: true },
];

const MOUTH_STYLES = [
  { id: 0, name: "Sorriso", type: "smile" },
  { id: 1, name: "Sorriso Aberto", type: "open_smile" },
  { id: 2, name: "Gatinho", type: "cat" },
  { id: 3, name: "Surpreso", type: "surprised" },
  { id: 4, name: "Língua", type: "tongue" },
  { id: 5, name: "Tímido", type: "shy" },
  { id: 6, name: "Kawaii", type: "kawaii" },
];

const SKIN_TONES = [
  { id: 0, name: "Claro", base: "#fde8d8", shadow: "#f5c7a9" },
  { id: 1, name: "Pêssego", base: "#fcd5b5", shadow: "#e8b896" },
  { id: 2, name: "Médio", base: "#d4a574", shadow: "#b8865c" },
  { id: 3, name: "Moreno", base: "#a0724a", shadow: "#8b5e3c" },
  { id: 4, name: "Escuro", base: "#6b4423", shadow: "#5a3a1e" },
  { id: 5, name: "Fantasia Rosa", base: "#fce4ec", shadow: "#f8bbd0" },
  { id: 6, name: "Fantasia Azul", base: "#e3f2fd", shadow: "#bbdefb" },
];

const OUTFIT_STYLES = [
  { id: 0, name: "Camisola", color: "#ec4899", secondary: "#f9a8d4", type: "sweater" },
  { id: 1, name: "Uniforme", color: "#1e40af", secondary: "#ffffff", type: "uniform" },
  { id: 2, name: "Vestido", color: "#7c3aed", secondary: "#c4b5fd", type: "dress" },
  { id: 3, name: "Hoodie", color: "#374151", secondary: "#6b7280", type: "hoodie" },
  { id: 4, name: "Maid", color: "#1f2937", secondary: "#ffffff", type: "maid" },
  { id: 5, name: "Kimono", color: "#dc2626", secondary: "#fde68a", type: "kimono" },
  { id: 6, name: "Aventureiro", color: "#854d0e", secondary: "#a16207", type: "adventurer" },
  { id: 7, name: "Pijama", color: "#dbeafe", secondary: "#bfdbfe", type: "pajama" },
  { id: 8, name: "Panda", color: "#1f2937", secondary: "#ffffff", type: "panda" },
];

const ACCESSORY_STYLES = [
  { id: 0, name: "Nenhum", emoji: "" },
  { id: 1, name: "Laço", emoji: "🎀" },
  { id: 2, name: "Orelhas Gato", emoji: "🐱" },
  { id: 3, name: "Coroa", emoji: "👑" },
  { id: 4, name: "Óculos", emoji: "👓" },
  { id: 5, name: "Flores", emoji: "🌸" },
  { id: 6, name: "Auréola", emoji: "😇" },
  { id: 7, name: "Chifres", emoji: "😈" },
  { id: 8, name: "Orelhas Panda", emoji: "🐼" },
  { id: 9, name: "Asas", emoji: "🧚" },
];

const DEFAULT_AVATAR: AvatarConfig = {
  hair: 0,
  eyes: 0,
  mouth: 0,
  skin: 0,
  outfit: 0,
  accessory: 0,
};

const SLOT_INFO: { key: AvatarSlot; label: string; emoji: string }[] = [
  { key: "hair", label: "Cabelo", emoji: "💇" },
  { key: "eyes", label: "Olhos", emoji: "👁️" },
  { key: "mouth", label: "Boca", emoji: "👄" },
  { key: "skin", label: "Pele", emoji: "✨" },
  { key: "outfit", label: "Roupa", emoji: "👕" },
  { key: "accessory", label: "Acess.", emoji: "🎀" },
];

// ─── Component ────────────────────────────────────────────────

interface AvatarBuilderProps {
  owner: string;
}

export default function AvatarBuilder({ owner }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [activeSlot, setActiveSlot] = useState<AvatarSlot>("hair");
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

  if (!loaded) return <div className="text-center py-8 text-purple-400 animate-pulse">A carregar...</div>;

  const getOptionsForSlot = () => {
    switch (activeSlot) {
      case "hair": return HAIR_STYLES.map((h) => ({ id: h.id, name: h.name, preview: <HairPreview style={h} /> }));
      case "eyes": return EYE_STYLES.map((e) => ({ id: e.id, name: e.name, preview: <EyePreview style={e} /> }));
      case "mouth": return MOUTH_STYLES.map((m) => ({ id: m.id, name: m.name, preview: <MouthPreview style={m} /> }));
      case "skin": return SKIN_TONES.map((s) => ({ id: s.id, name: s.name, preview: <div className="w-8 h-8 rounded-full border-2 border-white/20" style={{ background: s.base }} /> }));
      case "outfit": return OUTFIT_STYLES.map((o) => ({ id: o.id, name: o.name, preview: <div className="w-8 h-8 rounded-lg border-2 border-white/20" style={{ background: `linear-gradient(135deg, ${o.color}, ${o.secondary})` }} /> }));
      case "accessory": return ACCESSORY_STYLES.map((a) => ({ id: a.id, name: a.name, preview: <span className="text-2xl">{a.emoji || "✕"}</span> }));
    }
  };

  const options = getOptionsForSlot();

  return (
    <div className="mt-2 pb-8 px-4">
      {/* Large Avatar Preview */}
      <div className="relative mx-auto w-full max-w-[280px] aspect-square mb-4 rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-xl shadow-purple-900/20">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/80 via-purple-900/60 to-pink-900/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.1),transparent_50%)]" />

        {/* Character */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimeCharacter config={config} size={200} />
        </div>

        {/* Sparkle effects */}
        <div className="absolute top-4 right-6 text-xs animate-sparkle opacity-60">✨</div>
        <div className="absolute top-8 left-8 text-xs animate-sparkle opacity-40" style={{ animationDelay: "0.5s" }}>💫</div>
        <div className="absolute bottom-12 right-10 text-xs animate-sparkle opacity-50" style={{ animationDelay: "1s" }}>⭐</div>
      </div>

      {/* Slot selector */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 mb-3">
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

      {/* Options grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {options.map((opt) => {
          const isSelected = config[activeSlot] === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setConfig((prev) => ({ ...prev, [activeSlot]: opt.id }))}
              className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all active:scale-90 ${
                isSelected
                  ? "border-amber-400/60 bg-amber-900/20 shadow-md shadow-amber-400/10 scale-105"
                  : "border-purple-700/30 bg-purple-900/30 hover:border-purple-500/40"
              }`}
            >
              {opt.preview}
              <span className="text-[8px] text-purple-300 mt-1 text-center leading-tight">{opt.name}</span>
            </button>
          );
        })}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-pink-500/20"
      >
        {saving ? "A guardar..." : "Guardar Avatar"}
      </button>
    </div>
  );
}

// ─── Anime Character Renderer ─────────────────────────────────

function AnimeCharacter({ config, size }: { config: AvatarConfig; size: number }) {
  const skin = SKIN_TONES[config.skin] || SKIN_TONES[0];
  const hair = HAIR_STYLES[config.hair] || HAIR_STYLES[0];
  const eyes = EYE_STYLES[config.eyes] || EYE_STYLES[0];
  const mouth = MOUTH_STYLES[config.mouth] || MOUTH_STYLES[0];
  const outfit = OUTFIT_STYLES[config.outfit] || OUTFIT_STYLES[0];
  const accessory = ACCESSORY_STYLES[config.accessory] || ACCESSORY_STYLES[0];

  const scale = size / 200;

  return (
    <div className="relative animate-breathe" style={{ width: `${size}px`, height: `${size}px` }}>
      {/* Body / Outfit */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-[40%] shadow-md"
        style={{
          top: `${110 * scale}px`,
          width: `${70 * scale}px`,
          height: `${80 * scale}px`,
          background: `linear-gradient(180deg, ${outfit.color}, ${outfit.secondary})`,
          border: `2px solid ${outfit.color}88`,
        }}
      >
        {/* Collar detail */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 rounded-full" style={{ width: `${20 * scale}px`, height: `${8 * scale}px`, background: outfit.secondary }} />
      </div>

      {/* Neck */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: `${105 * scale}px`, width: `${16 * scale}px`, height: `${14 * scale}px`, background: skin.base, borderRadius: "30%" }}
      />

      {/* Head */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-[45%] shadow-lg"
        style={{
          top: `${25 * scale}px`,
          width: `${76 * scale}px`,
          height: `${82 * scale}px`,
          background: `linear-gradient(180deg, ${skin.base}, ${skin.shadow})`,
          border: `2px solid ${skin.shadow}66`,
        }}
      >
        {/* Blush */}
        <div className="absolute rounded-full opacity-40" style={{ bottom: `${20 * scale}px`, left: `${8 * scale}px`, width: `${14 * scale}px`, height: `${8 * scale}px`, background: "#f9a8d4" }} />
        <div className="absolute rounded-full opacity-40" style={{ bottom: `${20 * scale}px`, right: `${8 * scale}px`, width: `${14 * scale}px`, height: `${8 * scale}px`, background: "#f9a8d4" }} />

        {/* Eyes */}
        <div className="absolute flex justify-center gap-3" style={{ top: `${28 * scale}px`, left: 0, right: 0 }}>
          <AnimeEye style={eyes} scale={scale} />
          <AnimeEye style={eyes} scale={scale} isRight />
        </div>

        {/* Mouth */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `${52 * scale}px` }}>
          <AnimeMouth style={mouth} scale={scale} />
        </div>
      </div>

      {/* Hair (behind + front) */}
      <AnimeHair style={hair} scale={scale} />

      {/* Arms */}
      <div
        className="absolute rounded-full"
        style={{ top: `${120 * scale}px`, left: `${38 * scale}px`, width: `${14 * scale}px`, height: `${45 * scale}px`, background: skin.base, border: `1px solid ${skin.shadow}44`, transform: "rotate(15deg)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ top: `${120 * scale}px`, right: `${38 * scale}px`, width: `${14 * scale}px`, height: `${45 * scale}px`, background: skin.base, border: `1px solid ${skin.shadow}44`, transform: "rotate(-15deg)" }}
      />

      {/* Legs */}
      <div
        className="absolute rounded-full"
        style={{ bottom: `${5 * scale}px`, left: `${75 * scale}px`, width: `${14 * scale}px`, height: `${30 * scale}px`, background: skin.base, border: `1px solid ${skin.shadow}44` }}
      />
      <div
        className="absolute rounded-full"
        style={{ bottom: `${5 * scale}px`, right: `${75 * scale}px`, width: `${14 * scale}px`, height: `${30 * scale}px`, background: skin.base, border: `1px solid ${skin.shadow}44` }}
      />

      {/* Accessory */}
      {accessory.emoji && (
        <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: `${8 * scale}px`, fontSize: `${24 * scale}px` }}>
          {accessory.emoji}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function AnimeEye({ style, scale, isRight }: { style: typeof EYE_STYLES[0]; scale: number; isRight?: boolean }) {
  if (style.name === "Fechados Feliz") {
    return (
      <div style={{ width: `${14 * scale}px`, height: `${6 * scale}px` }}>
        <div className="w-full h-full border-b-2 rounded-b-full" style={{ borderColor: "#374151" }} />
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: `${14 * scale}px`, height: `${16 * scale}px` }}>
      {/* White */}
      <div className="absolute inset-0 rounded-[45%] bg-white shadow-inner" />
      {/* Iris */}
      <div
        className="absolute rounded-full"
        style={{
          top: `${3 * scale}px`,
          left: `${2 * scale}px`,
          width: `${10 * scale}px`,
          height: `${11 * scale}px`,
          background: `radial-gradient(circle at 40% 35%, ${style.color}, ${style.pupil})`,
        }}
      />
      {/* Pupil */}
      <div
        className="absolute rounded-full bg-black"
        style={{ top: `${5 * scale}px`, left: `${4.5 * scale}px`, width: `${5 * scale}px`, height: `${5 * scale}px` }}
      />
      {/* Sparkle */}
      {style.sparkle && (
        <>
          <div className="absolute rounded-full bg-white" style={{ top: `${4 * scale}px`, left: `${4 * scale}px`, width: `${3 * scale}px`, height: `${3 * scale}px` }} />
          <div className="absolute rounded-full bg-white/70" style={{ top: `${8 * scale}px`, right: `${3 * scale}px`, width: `${2 * scale}px`, height: `${2 * scale}px` }} />
        </>
      )}
      {/* Eyelash */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-full" style={{ background: "#1f2937" }} />
    </div>
  );
}

function AnimeMouth({ style, scale }: { style: typeof MOUTH_STYLES[0]; scale: number }) {
  const w = 16 * scale;
  const h = 10 * scale;

  switch (style.type) {
    case "smile":
      return <div style={{ width: w, height: h / 2, borderBottom: "2px solid #b45309", borderRadius: "0 0 50% 50%" }} />;
    case "open_smile":
      return <div className="rounded-b-full overflow-hidden" style={{ width: w, height: h, background: "#7f1d1d", border: "1.5px solid #b45309" }}><div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" style={{ width: w * 0.6, height: h * 0.4, background: "#ef4444" }} /></div>;
    case "cat":
      return <div style={{ width: w, fontSize: `${10 * scale}px`, textAlign: "center", lineHeight: 1 }}>ω</div>;
    case "surprised":
      return <div className="rounded-full" style={{ width: h * 0.7, height: h, background: "#7f1d1d", border: "1.5px solid #b45309", margin: "0 auto" }} />;
    case "tongue":
      return <div className="relative"><div style={{ width: w, height: h / 2, borderBottom: "2px solid #b45309", borderRadius: "0 0 50% 50%" }} /><div className="absolute top-full left-1/2 -translate-x-1/2 rounded-b-full" style={{ width: w * 0.3, height: h * 0.5, background: "#f87171" }} /></div>;
    case "shy":
      return <div style={{ width: w * 0.5, height: 2, background: "#b45309", margin: "0 auto", borderRadius: "2px" }} />;
    case "kawaii":
      return <div style={{ width: w, fontSize: `${9 * scale}px`, textAlign: "center", lineHeight: 1 }}>▽</div>;
    default:
      return <div style={{ width: w, height: h / 2, borderBottom: "2px solid #b45309", borderRadius: "0 0 50% 50%" }} />;
  }
}

function AnimeHair({ style, scale }: { style: typeof HAIR_STYLES[0]; scale: number }) {
  const baseStyle = {
    background: `linear-gradient(135deg, ${style.color}, ${style.highlight})`,
    border: `1.5px solid ${style.color}88`,
  };

  switch (style.style) {
    case "short":
      return (
        <div className="absolute left-1/2 -translate-x-1/2 rounded-t-[50%] rounded-b-[20%] z-[1]" style={{ top: `${18 * scale}px`, width: `${80 * scale}px`, height: `${40 * scale}px`, ...baseStyle }} />
      );
    case "long":
      return (<>
        <div className="absolute left-1/2 -translate-x-1/2 rounded-t-[50%] z-[1]" style={{ top: `${16 * scale}px`, width: `${82 * scale}px`, height: `${42 * scale}px`, ...baseStyle }} />
        <div className="absolute left-1/2 -translate-x-1/2 rounded-b-[40%] z-0" style={{ top: `${50 * scale}px`, width: `${86 * scale}px`, height: `${80 * scale}px`, ...baseStyle, opacity: 0.9 }} />
      </>);
    case "ponytail":
      return (<>
        <div className="absolute left-1/2 -translate-x-1/2 rounded-t-[50%] z-[1]" style={{ top: `${18 * scale}px`, width: `${80 * scale}px`, height: `${38 * scale}px`, ...baseStyle }} />
        <div className="absolute rounded-b-full z-0" style={{ top: `${35 * scale}px`, right: `${48 * scale}px`, width: `${20 * scale}px`, height: `${70 * scale}px`, ...baseStyle, transform: "rotate(10deg)" }} />
      </>);
    case "wavy":
      return (<>
        <div className="absolute left-1/2 -translate-x-1/2 rounded-t-[50%] z-[1]" style={{ top: `${16 * scale}px`, width: `${82 * scale}px`, height: `${42 * scale}px`, ...baseStyle }} />
        <div className="absolute rounded-[60%] z-0" style={{ top: `${50 * scale}px`, left: `${42 * scale}px`, width: `${30 * scale}px`, height: `${60 * scale}px`, ...baseStyle, opacity: 0.85 }} />
        <div className="absolute rounded-[60%] z-0" style={{ top: `${50 * scale}px`, right: `${42 * scale}px`, width: `${30 * scale}px`, height: `${60 * scale}px`, ...baseStyle, opacity: 0.85 }} />
      </>);
    case "spiky":
      return (<>
        <div className="absolute left-1/2 -translate-x-1/2 rounded-t-[40%] z-[1]" style={{ top: `${12 * scale}px`, width: `${84 * scale}px`, height: `${44 * scale}px`, ...baseStyle }} />
        <div className="absolute z-[2] rounded-t-full" style={{ top: `${6 * scale}px`, left: `${70 * scale}px`, width: `${16 * scale}px`, height: `${24 * scale}px`, ...baseStyle, transform: "rotate(20deg)" }} />
        <div className="absolute z-[2] rounded-t-full" style={{ top: `${4 * scale}px`, left: `${90 * scale}px`, width: `${14 * scale}px`, height: `${20 * scale}px`, ...baseStyle, transform: "rotate(35deg)" }} />
        <div className="absolute z-[2] rounded-t-full" style={{ top: `${8 * scale}px`, right: `${80 * scale}px`, width: `${14 * scale}px`, height: `${22 * scale}px`, ...baseStyle, transform: "rotate(-15deg)" }} />
      </>);
    case "bob":
      return (
        <div className="absolute left-1/2 -translate-x-1/2 rounded-[45%] z-[1]" style={{ top: `${16 * scale}px`, width: `${84 * scale}px`, height: `${60 * scale}px`, ...baseStyle }} />
      );
    case "bangs":
      return (<>
        <div className="absolute left-1/2 -translate-x-1/2 rounded-t-[50%] z-[1]" style={{ top: `${18 * scale}px`, width: `${80 * scale}px`, height: `${38 * scale}px`, ...baseStyle }} />
        <div className="absolute left-1/2 -translate-x-1/2 rounded-b-[30%] z-[5]" style={{ top: `${26 * scale}px`, width: `${60 * scale}px`, height: `${20 * scale}px`, ...baseStyle }} />
      </>);
    case "twintails":
      return (<>
        <div className="absolute left-1/2 -translate-x-1/2 rounded-t-[50%] z-[1]" style={{ top: `${18 * scale}px`, width: `${80 * scale}px`, height: `${36 * scale}px`, ...baseStyle }} />
        <div className="absolute rounded-b-full z-0" style={{ top: `${38 * scale}px`, left: `${40 * scale}px`, width: `${18 * scale}px`, height: `${65 * scale}px`, ...baseStyle }} />
        <div className="absolute rounded-b-full z-0" style={{ top: `${38 * scale}px`, right: `${40 * scale}px`, width: `${18 * scale}px`, height: `${65 * scale}px`, ...baseStyle }} />
      </>);
    case "buns":
      return (<>
        <div className="absolute left-1/2 -translate-x-1/2 rounded-t-[50%] z-[1]" style={{ top: `${18 * scale}px`, width: `${80 * scale}px`, height: `${36 * scale}px`, ...baseStyle }} />
        <div className="absolute rounded-full z-[2]" style={{ top: `${10 * scale}px`, left: `${52 * scale}px`, width: `${22 * scale}px`, height: `${22 * scale}px`, ...baseStyle }} />
        <div className="absolute rounded-full z-[2]" style={{ top: `${10 * scale}px`, right: `${52 * scale}px`, width: `${22 * scale}px`, height: `${22 * scale}px`, ...baseStyle }} />
      </>);
    case "fluffy":
      return (
        <div className="absolute left-1/2 -translate-x-1/2 rounded-[50%] z-[1]" style={{ top: `${12 * scale}px`, width: `${88 * scale}px`, height: `${50 * scale}px`, ...baseStyle }} />
      );
    default:
      return <div className="absolute left-1/2 -translate-x-1/2 rounded-t-[50%] z-[1]" style={{ top: `${18 * scale}px`, width: `${80 * scale}px`, height: `${40 * scale}px`, ...baseStyle }} />;
  }
}

// ─── Preview components for selector ──────────────────────────

function HairPreview({ style }: { style: typeof HAIR_STYLES[0] }) {
  return <div className="w-8 h-8 rounded-full" style={{ background: `linear-gradient(135deg, ${style.color}, ${style.highlight})` }} />;
}

function EyePreview({ style }: { style: typeof EYE_STYLES[0] }) {
  return (
    <div className="w-6 h-7 rounded-[40%] bg-white flex items-center justify-center">
      <div className="w-4 h-4 rounded-full" style={{ background: `radial-gradient(circle, ${style.color}, ${style.pupil})` }} />
    </div>
  );
}

function MouthPreview({ style }: { style: typeof MOUTH_STYLES[0] }) {
  return <span className="text-lg">{style.type === "cat" ? "ω" : style.type === "surprised" ? "○" : style.type === "kawaii" ? "▽" : "◡"}</span>;
}

export { SKIN_TONES, HAIR_STYLES, OUTFIT_STYLES, EYE_STYLES, ACCESSORY_STYLES };
