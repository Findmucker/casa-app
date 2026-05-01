"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Anime Animal Avatar System (Genshin-inspired) ────────────

export type AvatarSlot = "animal" | "eyes" | "mouth" | "top" | "bottom" | "accessory";

export interface AvatarConfig {
  animal: number;
  eyes: number;
  mouth: number;
  top: number;
  bottom: number;
  accessory: number;
}

// 11 cute anime animals with unique personality traits for animations
const ANIMALS = [
  { id: 0, name: "Panda", emoji: "🐼", bodyColor: "#2d2d3a", bellyColor: "#ffffff", earColor: "#1a1a2e", pawColor: "#1a1a2e", cheekColor: "#ffb3d9", noseColor: "#333333", tailType: "round", idle: "munch", weight: "heavy" },
  { id: 1, name: "Gatinho", emoji: "🐱", bodyColor: "#ff9f43", bellyColor: "#fff3e0", earColor: "#e67e22", pawColor: "#d35400", cheekColor: "#ffcccc", noseColor: "#ff6b81", tailType: "long", idle: "groom", weight: "light" },
  { id: 2, name: "Coelhinho", emoji: "🐰", bodyColor: "#fce4ec", bellyColor: "#ffffff", earColor: "#f8bbd0", pawColor: "#f48fb1", cheekColor: "#ff8a9e", noseColor: "#ff6b81", tailType: "puff", idle: "hop", weight: "light" },
  { id: 3, name: "Raposa", emoji: "🦊", bodyColor: "#ff6b35", bellyColor: "#fff8e1", earColor: "#e55100", pawColor: "#bf360c", cheekColor: "#ffab91", noseColor: "#37474f", tailType: "fluffy", idle: "sly", weight: "medium" },
  { id: 4, name: "Ursinho", emoji: "🐻", bodyColor: "#8d6e63", bellyColor: "#d7ccc8", earColor: "#6d4c41", pawColor: "#5d4037", cheekColor: "#ffccbc", noseColor: "#3e2723", tailType: "round", idle: "sleepy", weight: "heavy" },
  { id: 5, name: "Cãozinho", emoji: "🐶", bodyColor: "#ffcc80", bellyColor: "#fff8e1", earColor: "#ff8f00", pawColor: "#f57c00", cheekColor: "#ffcccc", noseColor: "#37474f", tailType: "wagging", idle: "excited", weight: "medium" },
  { id: 6, name: "Pinguim", emoji: "🐧", bodyColor: "#263238", bellyColor: "#ffffff", earColor: "#263238", pawColor: "#ff6f00", cheekColor: "#ffccdd", noseColor: "#ff6f00", tailType: "small", idle: "waddle", weight: "medium" },
  { id: 7, name: "Hamster", emoji: "🐹", bodyColor: "#ffb74d", bellyColor: "#ffffff", earColor: "#ff9800", pawColor: "#f57c00", cheekColor: "#ffab91", noseColor: "#ff6b81", tailType: "tiny", idle: "nibble", weight: "light" },
  { id: 8, name: "Coala", emoji: "🐨", bodyColor: "#78909c", bellyColor: "#eceff1", earColor: "#546e7a", pawColor: "#455a64", cheekColor: "#f8bbd0", noseColor: "#263238", tailType: "none", idle: "sleepy", weight: "heavy" },
  { id: 9, name: "Coruja", emoji: "🦉", bodyColor: "#6d4c41", bellyColor: "#d7ccc8", earColor: "#4e342e", pawColor: "#3e2723", cheekColor: "#ffccbc", noseColor: "#ff8f00", tailType: "feathers", idle: "blink", weight: "light" },
  { id: 10, name: "Sapinho", emoji: "🐸", bodyColor: "#66bb6a", bellyColor: "#e8f5e9", earColor: "#43a047", pawColor: "#388e3c", cheekColor: "#ff8a80", noseColor: "#2e7d32", tailType: "none", idle: "croak", weight: "light" },
];

const EYE_STYLES = [
  { id: 0, name: "Brilhantes", irisColor: "#42a5f5", pupilColor: "#0d47a1", sparkle: "double", shape: "round" },
  { id: 1, name: "Estrelas", irisColor: "#ab47bc", pupilColor: "#4a148c", sparkle: "star", shape: "round" },
  { id: 2, name: "Gentis", irisColor: "#66bb6a", pupilColor: "#1b5e20", sparkle: "single", shape: "soft" },
  { id: 3, name: "Felizes", irisColor: "#000000", pupilColor: "#000000", sparkle: "none", shape: "closed" },
  { id: 4, name: "Determinados", irisColor: "#ef5350", pupilColor: "#b71c1c", sparkle: "single", shape: "sharp" },
  { id: 5, name: "Sonhadores", irisColor: "#ffb74d", pupilColor: "#e65100", sparkle: "double", shape: "droopy" },
  { id: 6, name: "Heterocromia", irisColor: "#42a5f5|#ef5350", pupilColor: "#0d47a1|#b71c1c", sparkle: "double", shape: "round" },
];

const MOUTH_STYLES = [
  { id: 0, name: "Sorriso", type: "smile" },
  { id: 1, name: "Aberto", type: "open" },
  { id: 2, name: "Gatinho", type: "cat" },
  { id: 3, name: "Surpreso", type: "o" },
  { id: 4, name: "Tímido", type: "line" },
  { id: 5, name: "Travesso", type: "smirk" },
  { id: 6, name: "Feliz", type: "wide" },
];

const TOP_STYLES = [
  { id: 0, name: "Camisola", color: "#e91e63", secondary: "#f48fb1", pattern: "plain" },
  { id: 1, name: "Uniforme", color: "#1565c0", secondary: "#ffffff", pattern: "collar" },
  { id: 2, name: "Hoodie", color: "#424242", secondary: "#757575", pattern: "hood" },
  { id: 3, name: "Kimono", color: "#c62828", secondary: "#ffd54f", pattern: "wrap" },
  { id: 4, name: "Armadura", color: "#78909c", secondary: "#cfd8dc", pattern: "plates" },
  { id: 5, name: "Mago", color: "#6a1b9a", secondary: "#ce93d8", pattern: "stars" },
  { id: 6, name: "Marinheiro", color: "#ffffff", secondary: "#1565c0", pattern: "stripes" },
];

const BOTTOM_STYLES = [
  { id: 0, name: "Calças", color: "#37474f", secondary: "#546e7a", type: "pants" },
  { id: 1, name: "Saia", color: "#e91e63", secondary: "#f48fb1", type: "skirt" },
  { id: 2, name: "Shorts", color: "#4fc3f7", secondary: "#81d4fa", type: "shorts" },
  { id: 3, name: "Kimono", color: "#c62828", secondary: "#ffd54f", type: "hakama" },
  { id: 4, name: "Armadura", color: "#78909c", secondary: "#b0bec5", type: "armor" },
  { id: 5, name: "Mago", color: "#6a1b9a", secondary: "#9c27b0", type: "robe" },
  { id: 6, name: "Fluffy", color: "#fff3e0", secondary: "#ffe0b2", type: "fluffy" },
];

const ACCESSORY_STYLES = [
  { id: 0, name: "Nenhum", type: "none" },
  { id: 1, name: "Laço", type: "bow" },
  { id: 2, name: "Coroa", type: "crown" },
  { id: 3, name: "Chapéu Mago", type: "wizard_hat" },
  { id: 4, name: "Flores", type: "flowers" },
  { id: 5, name: "Óculos", type: "glasses" },
  { id: 6, name: "Cachecol", type: "scarf" },
];

const DEFAULT_AVATAR: AvatarConfig = { animal: 0, eyes: 0, mouth: 0, top: 0, bottom: 0, accessory: 0 };

const SLOT_INFO: { key: AvatarSlot; label: string; emoji: string }[] = [
  { key: "animal", label: "Animal", emoji: "🐾" },
  { key: "eyes", label: "Olhos", emoji: "👁️" },
  { key: "mouth", label: "Boca", emoji: "👄" },
  { key: "top", label: "Top", emoji: "👕" },
  { key: "bottom", label: "Bottom", emoji: "👖" },
  { key: "accessory", label: "Acess.", emoji: "✨" },
];

// ─── Main Component ───────────────────────────────────────────

interface AvatarBuilderProps {
  owner: string;
  onSave?: (config: AvatarConfig) => void;
}

export default function AvatarBuilder({ owner, onSave }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [activeSlot, setActiveSlot] = useState<AvatarSlot>("animal");
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
    onSave?.(config);
  };

  if (!loaded) return <div className="text-center py-8 text-purple-400 animate-pulse text-2xl">🐼</div>;

  const getOptions = () => {
    switch (activeSlot) {
      case "animal": return ANIMALS.map((a) => ({ id: a.id, name: a.name, preview: <span className="text-2xl">{a.emoji}</span> }));
      case "eyes": return EYE_STYLES.map((e) => ({ id: e.id, name: e.name, preview: <EyePreviewSmall style={e} /> }));
      case "mouth": return MOUTH_STYLES.map((m) => ({ id: m.id, name: m.name, preview: <MouthPreviewSmall type={m.type} /> }));
      case "top": return TOP_STYLES.map((t) => ({ id: t.id, name: t.name, preview: <div className="w-8 h-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.secondary})` }} /> }));
      case "bottom": return BOTTOM_STYLES.map((b) => ({ id: b.id, name: b.name, preview: <div className="w-8 h-8 rounded-lg" style={{ background: `linear-gradient(180deg, ${b.color}, ${b.secondary})` }} /> }));
      case "accessory": return ACCESSORY_STYLES.map((a) => ({ id: a.id, name: a.name, preview: <AccessoryPreviewSmall type={a.type} /> }));
    }
  };

  return (
    <div className="mt-2 pb-8 px-4">
      {/* Large 3D Preview */}
      <div className="relative mx-auto w-full max-w-[300px] aspect-square mb-5 rounded-2xl overflow-hidden border-2 border-purple-400/30 shadow-2xl">
        {/* 3D-style background with depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0533] via-[#2d1b4e] to-[#1a1035]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.1),transparent_40%)]" />
        {/* Floor reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[60%] h-[8%] bg-purple-500/10 rounded-full blur-md" />

        {/* Character */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimeAnimalCharacter config={config} size={240} />
        </div>

        {/* Genshin-style sparkle effects */}
        <div className="absolute top-6 right-8 animate-sparkle opacity-50">✦</div>
        <div className="absolute top-12 left-10 animate-sparkle opacity-30 text-purple-300" style={{ animationDelay: "0.7s" }}>✧</div>
        <div className="absolute bottom-16 right-12 animate-sparkle opacity-40 text-pink-300" style={{ animationDelay: "1.4s" }}>✦</div>
      </div>

      {/* Slot selector */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 mb-3">
        {SLOT_INFO.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSlot(s.key)}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 ${
              activeSlot === s.key
                ? "bg-gradient-to-r from-purple-500/40 to-pink-500/40 text-white border border-purple-400/50 shadow-sm shadow-purple-400/20"
                : "bg-purple-900/40 text-purple-400 border border-purple-700/30"
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {getOptions().map((opt) => {
          const isSelected = config[activeSlot] === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setConfig((prev) => ({ ...prev, [activeSlot]: opt.id }))}
              className={`flex flex-col items-center p-2.5 rounded-xl border-2 transition-all active:scale-90 ${
                isSelected
                  ? "border-purple-400/70 bg-purple-500/20 shadow-lg shadow-purple-500/15 scale-105"
                  : "border-purple-800/30 bg-purple-950/40 hover:border-purple-600/40"
              }`}
            >
              {opt.preview}
              <span className="text-[8px] text-purple-300 mt-1 text-center leading-tight">{opt.name}</span>
            </button>
          );
        })}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25"
      >
        {saving ? "A guardar..." : "✨ Guardar Avatar"}
      </button>
    </div>
  );
}

// ─── 8-bit Pixel Panda (based on the cute 3D panda reference) ─────────────

function PixelPanda({ size, idle, top, bottom, accessory }: { size: number; idle: string; top: typeof TOP_STYLES[0]; bottom: typeof BOTTOM_STYLES[0]; accessory: typeof ACCESSORY_STYLES[0] }) {
  const p = size / 16; // pixel size (16x16 grid scaled to size)

  // 16x16 pixel art panda matching the reference image:
  // Round white face, big black eye patches, small black ears, chubby body
  // Color palette
  const B = "#1a1a2e"; // black (ears, eye patches, arms, legs)
  const W = "#f5f0e8"; // white/cream (face, belly)
  const D = "#2d2d3a"; // dark grey (body outline, darker black)
  const N = "#3d3d4a"; // nose
  const E = "#111118"; // eye pupil
  const S = "#ffffff"; // eye shine
  const C = "#ffb3c8"; // cheek blush
  const BG = "transparent";

  // 16x20 pixel grid (each row is 16 pixels wide)
  // Designed to look like the reference: big round head on top, small chubby body below
  const pixels: (string | null)[][] = [
    //0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
    [null,null,null, B,   B,  null,null,null,null,null,null, B,   B,  null,null,null], // 0 ears
    [null,null, B,   D,   D,   B,  null,null,null,null, B,   D,   D,   B,  null,null], // 1 ears inner
    [null,null, B,   B,   B,   B,   W,   W,   W,   W,   B,   B,   B,   B,  null,null], // 2 top of head
    [null, B,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   B,  null], // 3
    [null, B,   W,   W,   B,   B,   W,   W,   W,   W,   B,   B,   W,   W,   B,  null], // 4 eye patches start
    [ B,   W,   W,   B,   B,   E,   B,   W,   W,   B,   E,   B,   B,   W,   W,   B], // 5 eyes
    [ B,   W,   W,   B,   S,   E,   B,   W,   W,   B,   E,   S,   B,   W,   W,   B], // 6 eyes with shine
    [ B,   W,   W,   W,   B,   B,   W,   W,   W,   W,   B,   B,   W,   W,   W,   B], // 7 below eyes
    [null, B,   W,   W,   W,   W,   W,   N,   N,   W,   W,   W,   W,   W,   B,  null], // 8 nose
    [null, B,   W,   W,   C,   W,   W,   W,   W,   W,   W,   C,   W,   W,   B,  null], // 9 cheeks + mouth area
    [null,null, B,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   B,  null,null], // 10 chin
    [null,null,null, B,   B,   W,   W,   W,   W,   W,   W,   B,   B,  null,null,null], // 11 neck/body start
    [null,null, B,   D,   B,   W,   W,   W,   W,   W,   W,   B,   D,   B,  null,null], // 12 body + arms
    [null, B,   D,   D,   B,   W,   W,   W,   W,   W,   W,   B,   D,   D,   B,  null], // 13 body
    [null, B,   D,   D,   B,   W,   W,   W,   W,   W,   W,   B,   D,   D,   B,  null], // 14 body
    [null,null, B,   B,   B,   B,   W,   W,   W,   W,   B,   B,   B,   B,  null,null], // 15 lower body
    [null,null,null, B,   B,  null, B,   B,   B,   B,  null, B,   B,  null,null,null], // 16 legs
    [null,null, B,   D,   D,   B,  null,null,null,null, B,   D,   D,   B,  null,null], // 17 feet
    [null,null, B,   B,   B,   B,  null,null,null,null, B,   B,   B,   B,  null,null], // 18 feet bottom
  ];

  const idleClass = `avatar-idle-${idle}`;

  return (
    <div className={`relative ${idleClass}`} style={{ width: `${size}px`, height: `${size}px` }}>
      {/* Ground shadow */}
      <div className="absolute rounded-full" style={{ bottom: `${0.5*p}px`, left: "20%", width: "60%", height: `${1.2*p}px`, background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)", filter: `blur(${p*0.3}px)` }} />

      {/* Pixel grid */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: `${16*p}px`, height: `${19*p}px`, imageRendering: "pixelated" }}>
        {pixels.map((row, y) => (
          row.map((color, x) => {
            if (!color) return null;
            return (
              <div
                key={`${x}-${y}`}
                className="absolute"
                style={{
                  left: `${x * p}px`,
                  top: `${y * p}px`,
                  width: `${p + 0.5}px`,
                  height: `${p + 0.5}px`,
                  backgroundColor: color,
                }}
              />
            );
          })
        ))}
      </div>

      {/* Clothing overlay (top) — pixel style colored squares on body */}
      {top.pattern !== "plain" && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40" style={{ width: `${16*p}px`, height: `${19*p}px` }}>
          {[12, 13, 14].map((y) =>
            [5, 6, 7, 8, 9, 10].map((x) => (
              <div key={`top-${x}-${y}`} className="absolute" style={{ left: `${x*p}px`, top: `${y*p}px`, width: `${p+0.5}px`, height: `${p+0.5}px`, backgroundColor: top.color }} />
            ))
          )}
        </div>
      )}

      {/* Accessory overlay */}
      {accessory.type === "crown" && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `calc(50% - ${9.5*p}px - ${2*p}px)` }}>
          <div className="flex">
            {[..."🟡🟡🟡"].map((_, i) => (
              <div key={i} className="absolute" style={{ left: `${(i*2 - 1)*p}px`, top: `${(i === 1 ? -1 : 0)*p}px`, width: `${p}px`, height: `${p}px`, backgroundColor: "#ffd700" }} />
            ))}
            <div style={{ width: `${5*p}px`, height: `${p}px`, backgroundColor: "#ffd700" }} />
            <div className="absolute" style={{ left: `${0*p}px`, top: `${-p}px`, width: `${p}px`, height: `${p}px`, backgroundColor: "#ffd700" }} />
            <div className="absolute" style={{ left: `${2*p}px`, top: `${-2*p}px`, width: `${p}px`, height: `${p}px`, backgroundColor: "#ffed4a" }} />
            <div className="absolute" style={{ left: `${4*p}px`, top: `${-p}px`, width: `${p}px`, height: `${p}px`, backgroundColor: "#ffd700" }} />
          </div>
        </div>
      )}
      {accessory.type === "bow" && (
        <div className="absolute" style={{ top: `calc(50% - ${9*p}px)`, left: `calc(50% + ${4*p}px)` }}>
          <div style={{ width: `${2*p}px`, height: `${2*p}px`, backgroundColor: "#e91e63", borderRadius: "2px" }} />
        </div>
      )}

      {/* Pixel scanline effect for retro feel */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: `repeating-linear-gradient(0deg, transparent, transparent ${p*0.8}px, rgba(0,0,0,0.4) ${p*0.8}px, rgba(0,0,0,0.4) ${p}px)` }} />
    </div>
  );
}

// ─── 3D Anime Animal Character (Enhanced with textures & animations) ─────

export function AnimeAnimalCharacter({ config, size }: { config: AvatarConfig; size: number }) {
  const animal = ANIMALS[config.animal] || ANIMALS[0];
  const eyes = EYE_STYLES[config.eyes] || EYE_STYLES[0];
  const mouth = MOUTH_STYLES[config.mouth] || MOUTH_STYLES[0];
  const top = TOP_STYLES[config.top] || TOP_STYLES[0];
  const bottom = BOTTOM_STYLES[config.bottom] || BOTTOM_STYLES[0];
  const accessory = ACCESSORY_STYLES[config.accessory] || ACCESSORY_STYLES[0];
  const s = size / 240; // scale factor

  // Panda uses special 8-bit pixel art renderer
  if (animal.id === 0) {
    return <PixelPanda size={size} idle={animal.idle} top={top} bottom={bottom} accessory={accessory} />;
  }

  // Fur texture overlay as a semi-transparent noise pattern
  const furTexture = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Ccircle cx='1' cy='1' r='0.6' fill='%23ffffff' opacity='0.07'/%3E%3Ccircle cx='4' cy='3' r='0.4' fill='%23000000' opacity='0.05'/%3E%3Ccircle cx='2' cy='5' r='0.5' fill='%23ffffff' opacity='0.04'/%3E%3C/svg%3E")`;

  // Rim light color (soft backlight glow)
  const rimLight = "rgba(180,140,255,0.25)";

  // Per-animal idle class
  const idleClass = `avatar-idle-${animal.idle}`;
  // Weight affects shadow size and sway speed
  const shadowOpacity = animal.weight === "heavy" ? 0.45 : animal.weight === "medium" ? 0.35 : 0.25;
  const shadowWidth = animal.weight === "heavy" ? "65%" : animal.weight === "medium" ? "55%" : "45%";

  return (
    <div className={`relative ${idleClass}`} style={{ width: `${size}px`, height: `${size}px` }}>
      {/* Ambient glow behind character */}
      <div className="absolute rounded-full animate-pulse" style={{ top: "15%", left: "20%", width: "60%", height: "60%", background: `radial-gradient(circle, ${animal.cheekColor}15, transparent 70%)`, filter: `blur(${15*s}px)` }} />

      {/* Shadow on ground — scales with animal weight */}
      <div className="absolute rounded-full" style={{ bottom: `${6*s}px`, left: `${50 - parseInt(shadowWidth)/2}%`, width: shadowWidth, height: `${14*s}px`, background: `radial-gradient(ellipse, rgba(0,0,0,${shadowOpacity}) 0%, transparent 70%)`, filter: `blur(${2*s}px)` }} />

      {/* Tail with fur texture — animal-specific animation */}
      <TailEnhanced type={animal.tailType} color={animal.bodyColor} scale={s} furTexture={furTexture} idle={animal.idle} />

      {/* Legs / Bottom clothing */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${18*s}px` }}>
        <div className="flex" style={{ gap: `${6*s}px` }}>
          <div className="rounded-b-full" style={{ width: `${24*s}px`, height: `${42*s}px`, background: `linear-gradient(180deg, ${bottom.color} 0%, ${bottom.secondary} 60%, ${darken(bottom.color, 20)} 100%)`, border: `${1.5*s}px solid ${bottom.color}55`, boxShadow: `inset ${3*s}px 0 ${6*s}px rgba(255,255,255,0.1), inset -${3*s}px 0 ${6*s}px rgba(0,0,0,0.15), 0 ${3*s}px ${6*s}px rgba(0,0,0,0.25)` }} />
          <div className="rounded-b-full" style={{ width: `${24*s}px`, height: `${42*s}px`, background: `linear-gradient(180deg, ${bottom.color} 0%, ${bottom.secondary} 60%, ${darken(bottom.color, 20)} 100%)`, border: `${1.5*s}px solid ${bottom.color}55`, boxShadow: `inset ${3*s}px 0 ${6*s}px rgba(255,255,255,0.1), inset -${3*s}px 0 ${6*s}px rgba(0,0,0,0.15), 0 ${3*s}px ${6*s}px rgba(0,0,0,0.25)` }} />
        </div>
        {/* Paws/feet with toe beans */}
        <div className="flex justify-between" style={{ marginTop: `-${2*s}px`, padding: `0 ${1*s}px` }}>
          <div className="relative rounded-full" style={{ width: `${20*s}px`, height: `${12*s}px`, background: `radial-gradient(ellipse at 50% 40%, ${lighten(animal.pawColor, 15)}, ${animal.pawColor})`, boxShadow: `inset 0 ${-2*s}px ${3*s}px rgba(0,0,0,0.2), 0 ${1*s}px ${2*s}px rgba(0,0,0,0.15)` }}>
            {/* Toe beans */}
            <div className="absolute flex gap-px" style={{ bottom: `${2*s}px`, left: "50%", transform: "translateX(-50%)" }}>
              <div className="rounded-full" style={{ width: `${3.5*s}px`, height: `${3*s}px`, background: `${lighten(animal.cheekColor, 10)}88` }} />
              <div className="rounded-full" style={{ width: `${3.5*s}px`, height: `${3*s}px`, background: `${lighten(animal.cheekColor, 10)}88` }} />
              <div className="rounded-full" style={{ width: `${3.5*s}px`, height: `${3*s}px`, background: `${lighten(animal.cheekColor, 10)}88` }} />
            </div>
          </div>
          <div className="relative rounded-full" style={{ width: `${20*s}px`, height: `${12*s}px`, background: `radial-gradient(ellipse at 50% 40%, ${lighten(animal.pawColor, 15)}, ${animal.pawColor})`, boxShadow: `inset 0 ${-2*s}px ${3*s}px rgba(0,0,0,0.2), 0 ${1*s}px ${2*s}px rgba(0,0,0,0.15)` }}>
            <div className="absolute flex gap-px" style={{ bottom: `${2*s}px`, left: "50%", transform: "translateX(-50%)" }}>
              <div className="rounded-full" style={{ width: `${3.5*s}px`, height: `${3*s}px`, background: `${lighten(animal.cheekColor, 10)}88` }} />
              <div className="rounded-full" style={{ width: `${3.5*s}px`, height: `${3*s}px`, background: `${lighten(animal.cheekColor, 10)}88` }} />
              <div className="rounded-full" style={{ width: `${3.5*s}px`, height: `${3*s}px`, background: `${lighten(animal.cheekColor, 10)}88` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Body / Top clothing with enhanced 3D */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: `${80*s}px`,
          width: `${76*s}px`,
          height: `${84*s}px`,
          borderRadius: "42% 42% 36% 36%",
          background: `linear-gradient(160deg, ${lighten(top.color, 15)} 0%, ${top.color} 30%, ${top.secondary} 70%, ${darken(top.color, 15)} 100%)`,
          border: `${2*s}px solid ${top.color}44`,
          boxShadow: `
            inset ${5*s}px ${4*s}px ${14*s}px rgba(255,255,255,0.18),
            inset -${4*s}px -${4*s}px ${10*s}px rgba(0,0,0,0.2),
            ${4*s}px ${6*s}px ${16*s}px rgba(0,0,0,0.35),
            -${2*s}px 0 ${8*s}px ${rimLight}
          `,
        }}
      >
        {/* Fabric texture overlay */}
        <div className="absolute inset-0 rounded-[inherit] opacity-30" style={{ backgroundImage: furTexture, backgroundSize: `${6*s}px ${6*s}px` }} />
        {/* Clothing detail */}
        {top.pattern === "collar" && (
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `${3*s}px` }}>
            <div style={{ width: `${20*s}px`, height: `${8*s}px`, borderBottom: `${3*s}px solid white`, borderLeft: `${8*s}px solid transparent`, borderRight: `${8*s}px solid transparent` }} />
          </div>
        )}
        {top.pattern === "stripes" && (
          <div className="absolute inset-0 overflow-hidden rounded-[inherit] opacity-25">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="absolute left-0 right-0" style={{ top: `${(15 + i * 12)*s}px`, height: `${3*s}px`, background: top.secondary }} />
            ))}
          </div>
        )}
        {top.pattern === "stars" && (
          <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute opacity-50 animate-sparkle" style={{ top: `${14*s}px`, left: `${12*s}px`, fontSize: `${11*s}px`, color: top.secondary }}>✦</div>
            <div className="absolute opacity-35 animate-sparkle" style={{ top: `${32*s}px`, right: `${14*s}px`, fontSize: `${9*s}px`, color: top.secondary, animationDelay: "0.5s" }}>✧</div>
            <div className="absolute opacity-25 animate-sparkle" style={{ bottom: `${15*s}px`, left: `${20*s}px`, fontSize: `${7*s}px`, color: top.secondary, animationDelay: "1s" }}>✦</div>
          </div>
        )}
        {top.pattern === "hood" && (
          <div className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ top: `${-4*s}px`, width: `${30*s}px`, height: `${16*s}px`, background: `linear-gradient(180deg, ${top.color}, ${top.secondary})`, border: `1px solid ${top.color}66` }} />
        )}
        {top.pattern === "wrap" && (
          <div className="absolute left-0 right-0 top-0 bottom-0 overflow-hidden rounded-[inherit]">
            <div className="absolute" style={{ top: `${5*s}px`, left: `${10*s}px`, width: `${35*s}px`, height: `${60*s}px`, borderRight: `${2.5*s}px solid ${top.secondary}`, transform: "rotate(10deg)" }} />
          </div>
        )}
        {top.pattern === "plates" && (
          <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute left-1/2 -translate-x-1/2 rounded-md" style={{ top: `${10*s}px`, width: `${35*s}px`, height: `${25*s}px`, background: `linear-gradient(180deg, ${lighten(top.color, 20)}, ${top.secondary})`, border: `1px solid ${top.secondary}66`, boxShadow: `inset 0 ${2*s}px ${4*s}px rgba(255,255,255,0.3)` }} />
          </div>
        )}
        {/* Belly peek with fur texture */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ bottom: `${6*s}px`, width: `${32*s}px`, height: `${22*s}px`, background: `radial-gradient(ellipse, ${animal.bellyColor}66, transparent)` }} />
        {/* Rim light edge */}
        <div className="absolute top-0 right-0 bottom-0 rounded-r-[inherit]" style={{ width: `${4*s}px`, background: `linear-gradient(180deg, transparent, ${rimLight}, transparent)` }} />
      </div>

      {/* Arms with enhanced 3D + fur */}
      <div className="absolute avatar-arm-left" style={{ top: `${92*s}px`, left: `${50*s}px`, width: `${20*s}px`, height: `${54*s}px`, borderRadius: "40%", background: `linear-gradient(160deg, ${lighten(top.color, 10)}, ${animal.bodyColor} 80%)`, border: `${1.5*s}px solid ${animal.bodyColor}33`, boxShadow: `inset ${2*s}px 0 ${5*s}px rgba(255,255,255,0.1), ${2*s}px ${3*s}px ${6*s}px rgba(0,0,0,0.25)`, transform: "rotate(15deg)", transformOrigin: "top center" }}>
        <div className="absolute inset-0 rounded-[inherit] opacity-20" style={{ backgroundImage: furTexture, backgroundSize: `${6*s}px ${6*s}px` }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" style={{ width: `${15*s}px`, height: `${13*s}px`, background: `radial-gradient(ellipse at 50% 40%, ${lighten(animal.pawColor, 12)}, ${animal.pawColor})`, boxShadow: `inset 0 ${-1*s}px ${3*s}px rgba(0,0,0,0.2)` }}>
          {/* Paw pad */}
          <div className="absolute rounded-full" style={{ bottom: `${1.5*s}px`, left: "50%", transform: "translateX(-50%)", width: `${6*s}px`, height: `${5*s}px`, background: `${animal.cheekColor}66` }} />
        </div>
      </div>
      <div className="absolute avatar-arm-right" style={{ top: `${92*s}px`, right: `${50*s}px`, width: `${20*s}px`, height: `${54*s}px`, borderRadius: "40%", background: `linear-gradient(200deg, ${lighten(top.color, 10)}, ${animal.bodyColor} 80%)`, border: `${1.5*s}px solid ${animal.bodyColor}33`, boxShadow: `inset -${2*s}px 0 ${5*s}px rgba(255,255,255,0.1), -${2*s}px ${3*s}px ${6*s}px rgba(0,0,0,0.25)`, transform: "rotate(-15deg)", transformOrigin: "top center" }}>
        <div className="absolute inset-0 rounded-[inherit] opacity-20" style={{ backgroundImage: furTexture, backgroundSize: `${6*s}px ${6*s}px` }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" style={{ width: `${15*s}px`, height: `${13*s}px`, background: `radial-gradient(ellipse at 50% 40%, ${lighten(animal.pawColor, 12)}, ${animal.pawColor})`, boxShadow: `inset 0 ${-1*s}px ${3*s}px rgba(0,0,0,0.2)` }}>
          <div className="absolute rounded-full" style={{ bottom: `${1.5*s}px`, left: "50%", transform: "translateX(-50%)", width: `${6*s}px`, height: `${5*s}px`, background: `${animal.cheekColor}66` }} />
        </div>
      </div>

      {/* Head — main focal point with lots of detail */}
      <div
        className="absolute left-1/2 -translate-x-1/2 avatar-head-bob"
        style={{
          top: `${14*s}px`,
          width: `${84*s}px`,
          height: `${80*s}px`,
          borderRadius: "52% 52% 46% 46%",
          background: `
            radial-gradient(ellipse at 35% 25%, ${lighten(animal.bodyColor, 25)} 0%, transparent 40%),
            radial-gradient(ellipse at 65% 75%, ${darken(animal.bodyColor, 15)} 0%, transparent 40%),
            linear-gradient(160deg, ${lighten(animal.bodyColor, 12)}, ${animal.bodyColor} 50%, ${darken(animal.bodyColor, 10)})
          `,
          border: `${2*s}px solid ${animal.bodyColor}66`,
          boxShadow: `
            inset ${4*s}px ${4*s}px ${12*s}px rgba(255,255,255,0.12),
            inset -${3*s}px -${3*s}px ${8*s}px rgba(0,0,0,0.15),
            0 ${5*s}px ${18*s}px rgba(0,0,0,0.4),
            -${3*s}px 0 ${10*s}px ${rimLight},
            ${3*s}px 0 ${10*s}px rgba(255,200,230,0.1)
          `,
        }}
      >
        {/* Fur texture overlay */}
        <div className="absolute inset-0 rounded-[inherit] opacity-25" style={{ backgroundImage: furTexture, backgroundSize: `${5*s}px ${5*s}px` }} />

        {/* Face lighter area (muzzle) */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-[50%]" style={{ top: `${20*s}px`, width: `${52*s}px`, height: `${50*s}px`, background: `radial-gradient(ellipse at 50% 40%, ${animal.bellyColor}cc, ${animal.bellyColor}44 60%, transparent 80%)` }} />

        {/* Panda eye patches (dark fur around eyes) */}
        {animal.name === "Panda" && (
          <>
            <div className="absolute rounded-[45%]" style={{ top: `${22*s}px`, left: `${14*s}px`, width: `${22*s}px`, height: `${20*s}px`, background: `radial-gradient(ellipse, ${animal.earColor} 50%, ${animal.earColor}88 80%, transparent)`, transform: "rotate(-8deg)" }} />
            <div className="absolute rounded-[45%]" style={{ top: `${22*s}px`, right: `${14*s}px`, width: `${22*s}px`, height: `${20*s}px`, background: `radial-gradient(ellipse, ${animal.earColor} 50%, ${animal.earColor}88 80%, transparent)`, transform: "rotate(8deg)" }} />
          </>
        )}

        {/* Cheeks (blush) — enhanced with glow */}
        <div className="absolute rounded-full" style={{ bottom: `${16*s}px`, left: `${9*s}px`, width: `${18*s}px`, height: `${12*s}px`, background: `radial-gradient(ellipse, ${animal.cheekColor}88, ${animal.cheekColor}22)`, filter: `blur(${1*s}px)` }} />
        <div className="absolute rounded-full" style={{ bottom: `${16*s}px`, right: `${9*s}px`, width: `${18*s}px`, height: `${12*s}px`, background: `radial-gradient(ellipse, ${animal.cheekColor}88, ${animal.cheekColor}22)`, filter: `blur(${1*s}px)` }} />

        {/* Eyes */}
        <div className="absolute flex justify-center" style={{ top: `${26*s}px`, left: 0, right: 0, gap: `${16*s}px` }}>
          <AnimeEye3D style={eyes} scale={s} />
          <AnimeEye3D style={eyes} scale={s} isRight />
        </div>

        {/* Nose — enhanced with 3D shine */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `${46*s}px`, width: `${9*s}px`, height: `${6*s}px`, borderRadius: "40% 40% 50% 50%", background: `radial-gradient(ellipse at 40% 30%, ${lighten(animal.noseColor, 30)}, ${animal.noseColor})`, boxShadow: `inset 0 ${1*s}px ${2*s}px rgba(255,255,255,0.3), 0 ${1*s}px ${2*s}px rgba(0,0,0,0.2)` }} />

        {/* Mouth */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `${53*s}px` }}>
          <AnimeMouth3D type={mouth.type} scale={s} />
        </div>

        {/* Specular highlight on forehead */}
        <div className="absolute rounded-full opacity-20" style={{ top: `${8*s}px`, left: `${20*s}px`, width: `${20*s}px`, height: `${12*s}px`, background: "radial-gradient(ellipse, white, transparent)" }} />

        {/* Rim light on head edge */}
        <div className="absolute top-[10%] right-0 bottom-[20%] rounded-r-[inherit]" style={{ width: `${3*s}px`, background: `linear-gradient(180deg, transparent, ${rimLight}, transparent)`, opacity: 0.6 }} />
      </div>

      {/* Ears with enhanced fur texture */}
      <AnimalEarsEnhanced animal={animal} scale={s} furTexture={furTexture} rimLight={rimLight} />

      {/* Accessory */}
      <Accessory3D type={accessory.type} scale={s} animalColor={animal.bodyColor} />
    </div>
  );
}

// ─── 3D Eye with Genshin-style depth ──────────────────────────

function AnimeEye3D({ style, scale: s, isRight }: { style: typeof EYE_STYLES[0]; scale: number; isRight?: boolean }) {
  if (style.shape === "closed") {
    return <div style={{ width: `${16*s}px`, height: `${8*s}px`, borderBottom: `${2.5*s}px solid #37474f`, borderRadius: "0 0 50% 50%" }} />;
  }

  const irisColors = style.irisColor.split("|");
  const pupilColors = style.pupilColor.split("|");
  const irisColor = isRight && irisColors[1] ? irisColors[1] : irisColors[0];
  const pupilColor = isRight && pupilColors[1] ? pupilColors[1] : pupilColors[0];

  const isSharp = style.shape === "sharp";
  const isDroopy = style.shape === "droopy";

  return (
    <div className="relative" style={{ width: `${16*s}px`, height: `${18*s}px` }}>
      {/* Eye white with 3D shading */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: isSharp ? "30% 30% 40% 40%" : isDroopy ? "50% 40% 40% 50%" : "45%",
          background: "linear-gradient(180deg, #ffffff, #f0f0f5)",
          boxShadow: `inset 0 ${2*s}px ${4*s}px rgba(0,0,0,0.1)`,
          border: `${1.5*s}px solid #37474f`,
        }}
      >
        {/* Iris with gradient for 3D depth */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: `${3*s}px`,
            width: `${11*s}px`,
            height: `${12*s}px`,
            background: `radial-gradient(circle at 35% 30%, ${lighten(irisColor, 30)}, ${irisColor} 60%, ${pupilColor})`,
            boxShadow: `inset 0 ${-2*s}px ${3*s}px ${pupilColor}66`,
          }}
        />
        {/* Pupil */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ top: `${5.5*s}px`, width: `${5.5*s}px`, height: `${6*s}px`, background: `radial-gradient(circle, #000 60%, ${pupilColor})` }} />
        {/* Sparkle highlights */}
        {style.sparkle !== "none" && (
          <>
            <div className="absolute rounded-full bg-white" style={{ top: `${3*s}px`, left: `${3.5*s}px`, width: `${4*s}px`, height: `${4*s}px` }} />
            {style.sparkle === "double" && <div className="absolute rounded-full bg-white/80" style={{ bottom: `${4*s}px`, right: `${3*s}px`, width: `${2.5*s}px`, height: `${2.5*s}px` }} />}
            {style.sparkle === "star" && <div className="absolute text-white/90" style={{ top: `${2*s}px`, left: `${3*s}px`, fontSize: `${6*s}px` }}>✦</div>}
          </>
        )}
      </div>
      {/* Upper eyelid shadow */}
      <div className="absolute top-0 left-0 right-0 rounded-t-full" style={{ height: `${3*s}px`, background: "rgba(0,0,0,0.1)" }} />
    </div>
  );
}

// ─── 3D Mouth ─────────────────────────────────────────────────

function AnimeMouth3D({ type, scale: s }: { type: string; scale: number }) {
  switch (type) {
    case "smile":
      return <div style={{ width: `${16*s}px`, height: `${7*s}px`, borderBottom: `${2*s}px solid #5d4037`, borderRadius: "0 0 50% 50%" }} />;
    case "open":
      return <div className="rounded-b-full overflow-hidden" style={{ width: `${14*s}px`, height: `${10*s}px`, background: "#5d2020", border: `${1.5*s}px solid #5d4037` }}><div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" style={{ width: `${8*s}px`, height: `${4*s}px`, background: "#ef5350" }} /></div>;
    case "cat":
      return <div className="text-center font-bold" style={{ fontSize: `${12*s}px`, color: "#5d4037" }}>ω</div>;
    case "o":
      return <div className="rounded-full" style={{ width: `${8*s}px`, height: `${9*s}px`, background: "#5d2020", border: `${1.5*s}px solid #5d4037`, margin: "0 auto" }} />;
    case "line":
      return <div style={{ width: `${10*s}px`, height: `${1.5*s}px`, background: "#5d4037", borderRadius: "2px", margin: "0 auto" }} />;
    case "smirk":
      return <div style={{ width: `${14*s}px`, height: `${6*s}px`, borderBottom: `${2*s}px solid #5d4037`, borderRadius: "0 0 20% 60%", transform: "rotate(-3deg)" }} />;
    case "wide":
      return <div style={{ width: `${20*s}px`, height: `${8*s}px`, borderBottom: `${2.5*s}px solid #5d4037`, borderRadius: "0 0 50% 50%" }} />;
    default:
      return <div style={{ width: `${14*s}px`, height: `${6*s}px`, borderBottom: `${2*s}px solid #5d4037`, borderRadius: "0 0 50% 50%" }} />;
  }
}

// ─── Enhanced Tail with fur ──────────────────────────────────

function TailEnhanced({ type, color, scale: s, furTexture, idle }: { type: string; color: string; scale: number; furTexture: string; idle: string }) {
  if (type === "none") return null;
  // Excited animals wag faster
  const tailClass = idle === "excited" ? "avatar-tail-wag-fast" : idle === "sly" ? "avatar-tail-sway" : "avatar-tail-wag";
  if (type === "round" || type === "puff") {
    return (
      <div className={`absolute rounded-full ${tailClass}`} style={{ bottom: `${55*s}px`, right: `${48*s}px`, width: `${18*s}px`, height: `${18*s}px`, background: `radial-gradient(ellipse at 40% 30%, ${lighten(color, 15)}, ${color})`, border: `1.5px solid ${color}66`, boxShadow: `inset ${2*s}px ${2*s}px ${4*s}px rgba(255,255,255,0.1), 0 ${2*s}px ${4*s}px rgba(0,0,0,0.2)` }}>
        <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundImage: furTexture, backgroundSize: `${5*s}px ${5*s}px` }} />
      </div>
    );
  }
  if (type === "long" || type === "fluffy") {
    return (
      <div className={`absolute ${tailClass}`} style={{ bottom: `${48*s}px`, right: `${42*s}px`, width: `${16*s}px`, height: `${44*s}px`, background: `linear-gradient(180deg, ${color}, ${lighten(color, 12)})`, border: `1.5px solid ${color}66`, transform: "rotate(-20deg)", borderRadius: "40%", boxShadow: `inset ${2*s}px 0 ${5*s}px rgba(255,255,255,0.1), 0 ${3*s}px ${6*s}px rgba(0,0,0,0.2)` }}>
        <div className="absolute inset-0 rounded-[inherit] opacity-25" style={{ backgroundImage: furTexture, backgroundSize: `${5*s}px ${5*s}px` }} />
        {/* Fluffy tip */}
        {type === "fluffy" && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full" style={{ width: `${20*s}px`, height: `${14*s}px`, background: `radial-gradient(ellipse, ${lighten(color, 20)}, ${color})` }} />}
      </div>
    );
  }
  return <div className={`absolute rounded-full ${tailClass}`} style={{ bottom: `${60*s}px`, right: `${52*s}px`, width: `${12*s}px`, height: `${12*s}px`, background: `radial-gradient(ellipse, ${lighten(color, 10)}, ${color})`, boxShadow: `0 ${2*s}px ${3*s}px rgba(0,0,0,0.15)` }} />;
}

// ─── Enhanced Animal Ears ─────────────────────────────────────

function AnimalEarsEnhanced({ animal, scale: s, furTexture, rimLight }: { animal: typeof ANIMALS[0]; scale: number; furTexture: string; rimLight: string }) {
  const earSize = animal.name === "Coelhinho" ? { w: 17, h: 42 } : animal.name === "Coruja" ? { w: 19, h: 22 } : { w: 22, h: 24 };
  const earRadius = animal.name === "Coelhinho" ? "45%" : animal.name === "Raposa" || animal.name === "Gatinho" ? "20% 20% 50% 50%" : "50%";

  return (
    <>
      <div
        className="absolute avatar-ear-twitch-left"
        style={{
          top: `${(animal.name === "Coelhinho" ? -6 : 8) * s}px`,
          left: `${66*s}px`,
          width: `${earSize.w*s}px`,
          height: `${earSize.h*s}px`,
          borderRadius: earRadius,
          background: `linear-gradient(160deg, ${lighten(animal.earColor, 12)}, ${animal.earColor} 60%, ${darken(animal.earColor, 10)})`,
          border: `${1.5*s}px solid ${animal.earColor}66`,
          transform: "rotate(-15deg)",
          transformOrigin: "bottom center",
          boxShadow: `
            inset ${2*s}px ${2*s}px ${5*s}px rgba(255,255,255,0.1),
            inset -${1*s}px -${2*s}px ${4*s}px rgba(0,0,0,0.15),
            0 ${3*s}px ${8*s}px rgba(0,0,0,0.25),
            -${1*s}px 0 ${4*s}px ${rimLight}
          `,
        }}
      >
        <div className="absolute inset-0 rounded-[inherit] opacity-20" style={{ backgroundImage: furTexture, backgroundSize: `${5*s}px ${5*s}px` }} />
        {/* Inner ear */}
        <div className="absolute rounded-[inherit] opacity-50" style={{ top: "20%", left: "20%", right: "20%", bottom: "20%", background: `radial-gradient(ellipse, ${animal.cheekColor}, ${lighten(animal.cheekColor, 10)}44)` }} />
      </div>
      <div
        className="absolute avatar-ear-twitch-right"
        style={{
          top: `${(animal.name === "Coelhinho" ? -6 : 8) * s}px`,
          right: `${66*s}px`,
          width: `${earSize.w*s}px`,
          height: `${earSize.h*s}px`,
          borderRadius: earRadius,
          background: `linear-gradient(200deg, ${lighten(animal.earColor, 12)}, ${animal.earColor} 60%, ${darken(animal.earColor, 10)})`,
          border: `${1.5*s}px solid ${animal.earColor}66`,
          transform: "rotate(15deg)",
          transformOrigin: "bottom center",
          boxShadow: `
            inset -${2*s}px ${2*s}px ${5*s}px rgba(255,255,255,0.1),
            inset ${1*s}px -${2*s}px ${4*s}px rgba(0,0,0,0.15),
            0 ${3*s}px ${8*s}px rgba(0,0,0,0.25),
            ${1*s}px 0 ${4*s}px ${rimLight}
          `,
        }}
      >
        <div className="absolute inset-0 rounded-[inherit] opacity-20" style={{ backgroundImage: furTexture, backgroundSize: `${5*s}px ${5*s}px` }} />
        <div className="absolute rounded-[inherit] opacity-50" style={{ top: "20%", left: "20%", right: "20%", bottom: "20%", background: `radial-gradient(ellipse, ${animal.cheekColor}, ${lighten(animal.cheekColor, 10)}44)` }} />
      </div>
    </>
  );
}

// ─── Tail (legacy, kept for reference) ───────────────────────

function Tail({ type, color, scale: s }: { type: string; color: string; scale: number }) {
  // Now delegated to TailEnhanced — this is unused but kept for compat
  if (type === "none") return null;
  return null;
}

// ─── 3D Accessory ─────────────────────────────────────────────

function Accessory3D({ type, scale: s, animalColor }: { type: string; scale: number; animalColor: string }) {
  switch (type) {
    case "bow":
      return (
        <div className="absolute z-10" style={{ top: `${6*s}px`, left: `${108*s}px` }}>
          <div style={{ width: `${20*s}px`, height: `${14*s}px`, background: "#e91e63", borderRadius: "30%", border: "1px solid #c2185b", boxShadow: `0 ${2*s}px ${4*s}px rgba(0,0,0,0.2)` }} />
        </div>
      );
    case "crown":
      return (
        <div className="absolute z-10 left-1/2 -translate-x-1/2" style={{ top: `${4*s}px` }}>
          <div style={{ width: `${30*s}px`, height: `${18*s}px`, background: "linear-gradient(180deg, #ffd54f, #ff8f00)", clipPath: "polygon(0% 100%, 10% 30%, 25% 70%, 50% 0%, 75% 70%, 90% 30%, 100% 100%)", filter: `drop-shadow(0 ${2*s}px ${3*s}px rgba(0,0,0,0.3))` }} />
        </div>
      );
    case "wizard_hat":
      return (
        <div className="absolute z-10 left-1/2 -translate-x-1/2" style={{ top: `${-10*s}px` }}>
          <div style={{ width: `${40*s}px`, height: `${35*s}px`, background: "linear-gradient(180deg, #4a148c, #6a1b9a)", clipPath: "polygon(50% 0%, 5% 100%, 95% 100%)", border: "1px solid #9c27b0", filter: `drop-shadow(0 ${2*s}px ${4*s}px rgba(0,0,0,0.3))` }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" style={{ width: `${44*s}px`, height: `${8*s}px`, background: "linear-gradient(90deg, #ffd54f, #ff8f00)", border: "1px solid #f57c00" }} />
        </div>
      );
    case "flowers":
      return (
        <div className="absolute z-10" style={{ top: `${8*s}px`, right: `${72*s}px`, fontSize: `${16*s}px` }}>
          🌸
        </div>
      );
    case "glasses":
      return (
        <div className="absolute z-10 left-1/2 -translate-x-1/2 flex" style={{ top: `${38*s}px`, gap: `${4*s}px` }}>
          <div className="rounded-full" style={{ width: `${18*s}px`, height: `${16*s}px`, border: `${2*s}px solid #37474f`, background: "rgba(255,255,255,0.1)" }} />
          <div className="rounded-full" style={{ width: `${18*s}px`, height: `${16*s}px`, border: `${2*s}px solid #37474f`, background: "rgba(255,255,255,0.1)" }} />
        </div>
      );
    case "scarf":
      return (
        <div className="absolute z-10 left-1/2 -translate-x-1/2" style={{ top: `${72*s}px` }}>
          <div className="rounded-full" style={{ width: `${55*s}px`, height: `${14*s}px`, background: "linear-gradient(90deg, #e91e63, #f48fb1, #e91e63)", border: "1px solid #c2185b", boxShadow: `0 ${2*s}px ${3*s}px rgba(0,0,0,0.2)` }} />
          <div className="absolute rounded-b-lg" style={{ top: `${10*s}px`, right: `${5*s}px`, width: `${10*s}px`, height: `${20*s}px`, background: "linear-gradient(180deg, #e91e63, #ad1457)" }} />
        </div>
      );
    default:
      return null;
  }
}

// ─── Small previews for selector ──────────────────────────────

function EyePreviewSmall({ style }: { style: typeof EYE_STYLES[0] }) {
  const colors = style.irisColor.split("|");
  return (
    <div className="w-6 h-7 rounded-[40%] bg-white flex items-center justify-center shadow-inner border border-slate-200/50">
      <div className="w-4 h-4 rounded-full" style={{ background: `radial-gradient(circle, ${colors[0]}, ${style.pupilColor.split("|")[0]})` }} />
    </div>
  );
}

function MouthPreviewSmall({ type }: { type: string }) {
  const labels: Record<string, string> = { smile: "◡", open: "◠", cat: "ω", o: "○", line: "—", smirk: "⌒", wide: "◡◡" };
  return <span className="text-lg text-purple-300">{labels[type] || "◡"}</span>;
}

function AccessoryPreviewSmall({ type }: { type: string }) {
  const emojis: Record<string, string> = { none: "✕", bow: "🎀", crown: "👑", wizard_hat: "🧙", flowers: "🌸", glasses: "👓", scarf: "🧣" };
  return <span className="text-xl">{emojis[type] || "✕"}</span>;
}

// ─── Utility ──────────────────────────────────────────────────

function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + percent);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
  const b = Math.min(255, (num & 0x0000FF) + percent);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - percent);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
  const b = Math.max(0, (num & 0x0000FF) - percent);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export { ANIMALS };
