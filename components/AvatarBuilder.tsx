"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Anime Animal Avatar System (Genshin-inspired) ────────────

export type AvatarSlot = "animal" | "eyes" | "mouth" | "top" | "bottom" | "accessory" | "background" | "effect";

export interface AvatarConfig {
  animal: number;
  eyes: number;
  mouth: number;
  top: number;
  bottom: number;
  accessory: number;
  background: number;
  effect: number;
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
  { id: 0, name: "Azul", eyeColor: "#42a5f5", shineColor: "#ffffff", pupilColor: "#0d47a1" },
  { id: 1, name: "Roxo", eyeColor: "#ab47bc", shineColor: "#ffffff", pupilColor: "#4a148c" },
  { id: 2, name: "Verde", eyeColor: "#66bb6a", shineColor: "#ffffff", pupilColor: "#1b5e20" },
  { id: 3, name: "Vermelho", eyeColor: "#ef5350", shineColor: "#ffffff", pupilColor: "#b71c1c" },
  { id: 4, name: "Dourado", eyeColor: "#ffb74d", shineColor: "#ffffff", pupilColor: "#e65100" },
  { id: 5, name: "Rosa", eyeColor: "#f48fb1", shineColor: "#ffffff", pupilColor: "#c2185b" },
  { id: 6, name: "Heterocromia", eyeColor: "#42a5f5", shineColor: "#ffffff", pupilColor: "#0d47a1", rightEyeColor: "#ef5350", rightPupilColor: "#b71c1c" },
];

const MOUTH_STYLES = [
  { id: 0, name: "Sorriso", type: "smile" },
  { id: 1, name: "Aberto", type: "open" },
  { id: 2, name: "Gatinho", type: "cat" },
  { id: 3, name: "Surpreso", type: "o" },
  { id: 4, name: "Tímido", type: "line" },
  { id: 5, name: "Dentes", type: "teeth" },
  { id: 6, name: "Língua", type: "tongue" },
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

const BACKGROUND_STYLES = [
  { id: 0, name: "Floresta", color1: "#0d3b1e", color2: "#1a5c32", biome: "forest" },
  { id: 1, name: "Oceano", color1: "#0a1e3d", color2: "#1a4a7a", biome: "ocean" },
  { id: 2, name: "Deserto", color1: "#4a3a1a", color2: "#c2956b", biome: "desert" },
  { id: 3, name: "Neve", color1: "#b8d4e8", color2: "#e8f0f8", biome: "snow" },
  { id: 4, name: "Vulcão", color1: "#1a0505", color2: "#4a1a0a", biome: "volcano" },
  { id: 5, name: "Céu", color1: "#87ceeb", color2: "#e0f0ff", biome: "sky" },
  { id: 6, name: "Espaço", color1: "#05050f", color2: "#1a1a3d", biome: "space" },
];

const EFFECT_STYLES = [
  { id: 0, name: "Nenhum", type: "none" },
  { id: 1, name: "Estrelas", type: "stars" },
  { id: 2, name: "Corações", type: "hearts" },
  { id: 3, name: "Brilhos", type: "sparkles" },
  { id: 4, name: "Bolhas", type: "bubbles" },
  { id: 5, name: "Neve", type: "snow" },
  { id: 6, name: "Pixéis", type: "pixels" },
];

const DEFAULT_AVATAR: AvatarConfig = { animal: 0, eyes: 0, mouth: 0, top: 0, bottom: 0, accessory: 0, background: 0, effect: 0 };

const SLOT_INFO: { key: AvatarSlot; label: string; emoji: string }[] = [
  { key: "animal", label: "Animal", emoji: "🐾" },
  { key: "eyes", label: "Olhos", emoji: "👁️" },
  { key: "mouth", label: "Boca", emoji: "👄" },
  { key: "top", label: "Roupa Cima", emoji: "👕" },
  { key: "bottom", label: "Roupa Baixo", emoji: "👖" },
  { key: "accessory", label: "Acessórios", emoji: "🎀" },
  { key: "background", label: "Fundo", emoji: "🎨" },
  { key: "effect", label: "Efeitos", emoji: "✨" },
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
      case "eyes": return EYE_STYLES.map((e) => ({ id: e.id, name: e.name, preview: <EyePreview8bit style={e} /> }));
      case "mouth": return MOUTH_STYLES.map((m) => ({ id: m.id, name: m.name, preview: <MouthPreviewSmall type={m.type} /> }));
      case "top": return TOP_STYLES.map((t) => ({ id: t.id, name: t.name, preview: <div className="w-8 h-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.secondary})` }} /> }));
      case "bottom": return BOTTOM_STYLES.map((b) => ({ id: b.id, name: b.name, preview: <div className="w-8 h-8 rounded-lg" style={{ background: `linear-gradient(180deg, ${b.color}, ${b.secondary})` }} /> }));
      case "accessory": return ACCESSORY_STYLES.map((a) => ({ id: a.id, name: a.name, preview: <AccessoryPreviewSmall type={a.type} /> }));
      case "background": return BACKGROUND_STYLES.map((b) => ({ id: b.id, name: b.name, preview: <div className="w-8 h-8 rounded-lg border border-purple-700/30" style={{ background: `linear-gradient(180deg, ${b.color1}, ${b.color2})` }} /> }));
      case "effect": return EFFECT_STYLES.map((e) => ({ id: e.id, name: e.name, preview: <EffectPreviewSmall type={e.type} /> }));
    }
  };

  return (
    <div className="mt-2 pb-8 px-4">
      {/* Large 3D Preview */}
      {(() => {
        const bg = BACKGROUND_STYLES[config.background] || BACKGROUND_STYLES[0];
        const eff = EFFECT_STYLES[config.effect] || EFFECT_STYLES[0];
        return (
          <div className="relative mx-auto w-full max-w-[300px] aspect-square mb-5 rounded-2xl overflow-hidden border-2 border-purple-400/30 shadow-2xl">
            {/* Dynamic background */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${bg.color1}, ${bg.color2})` }} />
            <BiomeOverlay biome={bg.biome} />
            {/* Floor reflection */}
            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[60%] h-[8%] bg-white/5 rounded-full blur-md" />

            {/* Character */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimeAnimalCharacter config={config} size={240} />
            </div>

            {/* Dynamic effects */}
            <AvatarEffect type={eff.type} />
          </div>
        );
      })()}

      {/* Slot selector */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 mb-3">
        {SLOT_INFO.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSlot(s.key)}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 ${
              activeSlot === s.key
                ? "bg-gradient-to-r from-rose-400/80 to-pink-400/80 text-white border border-rose-300/50 shadow-sm shadow-rose-300/20"
                : "bg-white/70 text-purple-600 border border-purple-200/40 hover:bg-white/90"
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
                  ? "border-rose-400/70 bg-rose-50/60 shadow-lg shadow-rose-300/15 scale-105"
                  : "border-purple-200/40 bg-white/60 hover:border-rose-300/50"
              }`}
            >
              {opt.preview}
              <span className="text-[8px] text-purple-600 mt-1 text-center leading-tight">{opt.name}</span>
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

// ─── 8-bit Pixel Animal Avatars ──────────────────────────────────────────

// Pixel art grids for all 11 animals (16 wide × 19 tall)
// null = transparent, string = hex color

function getPixelGrid(animalId: number): { pixels: (string | null)[][]; palette: Record<string, string> } {
  switch (animalId) {
    case 0: // Panda
      return {
        palette: { B: "#1a1a2e", W: "#f5f0e8", D: "#2d2d3a", N: "#3d3d4a", E: "#111118", S: "#ffffff", C: "#ffb3c8" },
        pixels: (() => {
          const [B, W, D, N, E, S, C, _] = ["#1a1a2e", "#f5f0e8", "#2d2d3a", "#3d3d4a", "#111118", "#ffffff", "#ffb3c8", null];
          return [
            [_,_,_, B, B,_,_,_,_,_,_, B, B,_,_,_],
            [_,_, B, D, D, B,_,_,_,_, B, D, D, B,_,_],
            [_,_, B, B, B, B, W, W, W, W, B, B, B, B,_,_],
            [_, B, W, W, W, W, W, W, W, W, W, W, W, W, B,_],
            [_, B, W, W, B, B, W, W, W, W, B, B, W, W, B,_],
            [B, W, W, B, B, E, B, W, W, B, E, B, B, W, W, B],
            [B, W, W, B, S, E, B, W, W, B, E, S, B, W, W, B],
            [B, W, W, W, B, B, W, W, W, W, B, B, W, W, W, B],
            [_, B, W, W, W, W, W, N, N, W, W, W, W, W, B,_],
            [_, B, W, W, C, W, W, W, W, W, W, C, W, W, B,_],
            [_,_, B, W, W, W, W, W, W, W, W, W, W, B,_,_],
            [_,_,_, B, B, W, W, W, W, W, W, B, B,_,_,_],
            [_,_, B, D, B, W, W, W, W, W, W, B, D, B,_,_],
            [_, B, D, D, B, W, W, W, W, W, W, B, D, D, B,_],
            [_, B, D, D, B, W, W, W, W, W, W, B, D, D, B,_],
            [_,_, B, B, B, B, W, W, W, W, B, B, B, B,_,_],
            [_,_,_, B, B,_, B, B, B, B,_, B, B,_,_,_],
            [_,_, B, D, D, B,_,_,_,_, B, D, D, B,_,_],
            [_,_, B, B, B, B,_,_,_,_, B, B, B, B,_,_],
          ];
        })(),
      };
    case 1: // Gatinho (orange tabby)
      return {
        palette: {},
        pixels: (() => {
          const [O, W, D, N, E, S, C, P, _] = ["#ff9f43", "#fff3e0", "#e67e22", "#ff6b81", "#111118", "#ffffff", "#ffcccc", "#d35400", null];
          return [
            [_,_,_, D, D,_,_,_,_,_,_, D, D,_,_,_],
            [_,_, D, O, O, D,_,_,_,_, D, O, O, D,_,_],
            [_,_, D, O, O, O, O, O, O, O, O, O, O, D,_,_],
            [_, D, O, O, O, O, O, O, O, O, O, O, O, O, D,_],
            [_, D, O, O, O, O, O, O, O, O, O, O, O, O, D,_],
            [D, O, O, O, E, E, O, O, O, O, E, E, O, O, O, D],
            [D, O, O, O, S, E, O, W, W, O, E, S, O, O, O, D],
            [D, O, O, O, O, O, O, W, W, O, O, O, O, O, O, D],
            [_, D, O, O, O, O, O, N, N, O, O, O, O, O, D,_],
            [_, D, O, C, O, O, O, O, O, O, O, O, C, O, D,_],
            [_,_, D, O, O, O, O, D, O, D, O, O, O, D,_,_],
            [_,_,_, D, D, O, O, O, O, O, O, D, D,_,_,_],
            [_,_, D, O, D, W, W, W, W, W, W, D, O, D,_,_],
            [_, D, O, O, D, W, W, W, W, W, W, D, O, O, D,_],
            [_, D, O, O, D, W, W, W, W, W, W, D, O, O, D,_],
            [_,_, D, D, D, D, W, W, W, W, D, D, D, D,_,_],
            [_,_,_, D, D,_, D, D, D, D,_, D, D,_,_,_],
            [_,_, D, P, P, D,_,_,_,_, D, P, P, D,_,_],
            [_,_, D, D, D, D,_,_, O, O, D, D, D, D,_,_],
          ];
        })(),
      };
    case 2: // Coelhinho (pink bunny)
      return {
        palette: {},
        pixels: (() => {
          const [P, W, D, N, E, S, C, I, _] = ["#fce4ec", "#ffffff", "#f48fb1", "#ff6b81", "#111118", "#ffffff", "#ff8a9e", "#f8bbd0", null];
          return [
            [_,_,_,_, D, D,_,_,_,_, D, D,_,_,_,_],
            [_,_,_,_, D, I, D,_,_, D, I, D,_,_,_,_],
            [_,_,_,_, D, I, D,_,_, D, I, D,_,_,_,_],
            [_,_,_,_, D, P, D,_,_, D, P, D,_,_,_,_],
            [_,_, D, D, D, P, P, P, P, P, P, D, D, D,_,_],
            [_, D, P, P, P, P, P, P, P, P, P, P, P, P, D,_],
            [D, P, P, P, E, E, P, P, P, P, E, E, P, P, P, D],
            [D, P, P, P, S, E, P, P, P, P, E, S, P, P, P, D],
            [D, P, P, P, P, P, P, N, N, P, P, P, P, P, P, D],
            [_, D, P, C, P, P, P, P, P, P, P, P, C, P, D,_],
            [_,_, D, P, P, P, P, D, P, P, P, P, P, D,_,_],
            [_,_,_, D, D, P, P, P, P, P, P, D, D,_,_,_],
            [_,_, D, P, D, W, W, W, W, W, W, D, P, D,_,_],
            [_, D, P, P, D, W, W, W, W, W, W, D, P, P, D,_],
            [_, D, P, P, D, W, W, W, W, W, W, D, P, P, D,_],
            [_,_, D, D, D, D, W, W, W, W, D, D, D, D,_,_],
            [_,_,_, D, D,_, D, D, D, D,_, D, D,_,_,_],
            [_,_, D, I, I, D,_,_,_,_, D, I, I, D,_,_],
            [_,_, D, D, D, D,_,_,_,_, D, D, D, D,_,_],
          ];
        })(),
      };
    case 3: // Raposa (orange fox)
      return {
        palette: {},
        pixels: (() => {
          const [O, W, D, N, E, S, C, T, _] = ["#ff6b35", "#fff8e1", "#bf360c", "#37474f", "#111118", "#ffffff", "#ffab91", "#e55100", null];
          return [
            [_,_, D, D,_,_,_,_,_,_,_,_, D, D,_,_],
            [_,_, D, T, D,_,_,_,_,_,_, D, T, D,_,_],
            [_,_, D, O, O, D,_,_,_,_, D, O, O, D,_,_],
            [_,_, D, O, O, O, O, O, O, O, O, O, O, D,_,_],
            [_, D, O, O, O, O, O, O, O, O, O, O, O, O, D,_],
            [D, O, O, O, E, E, O, W, W, O, E, E, O, O, O, D],
            [D, O, O, O, S, E, O, W, W, O, E, S, O, O, O, D],
            [D, O, O, O, O, O, W, W, W, W, O, O, O, O, O, D],
            [_, D, O, O, O, W, W, N, N, W, W, O, O, O, D,_],
            [_, D, O, C, O, W, W, W, W, W, W, O, C, O, D,_],
            [_,_, D, O, O, O, W, W, W, W, O, O, O, D,_,_],
            [_,_,_, D, D, O, O, O, O, O, O, D, D,_,_,_],
            [_,_, D, O, D, W, W, W, W, W, W, D, O, D,_,_],
            [_, D, O, O, D, W, W, W, W, W, W, D, O, O, D,_],
            [_, D, O, O, D, W, W, W, W, W, W, D, O, O, D,_],
            [_,_, D, D, D, D, W, W, W, W, D, D, D, D,_,_],
            [_,_,_, D, D,_, D, D, D, D,_, D, D,_,_,_],
            [_,_, D, T, T, D,_,_,_,_, D, T, T, D,_,_],
            [_,_, D, D, D, D,_,_, O, T, O, D, D, D,_,_],
          ];
        })(),
      };
    case 4: // Ursinho (brown bear)
      return {
        palette: {},
        pixels: (() => {
          const [B, W, D, N, E, S, C, P, _] = ["#8d6e63", "#d7ccc8", "#5d4037", "#3e2723", "#111118", "#ffffff", "#ffccbc", "#6d4c41", null];
          return [
            [_,_,_, D, D,_,_,_,_,_,_, D, D,_,_,_],
            [_,_, D, P, P, D,_,_,_,_, D, P, P, D,_,_],
            [_,_, D, D, D, B, B, B, B, B, B, D, D, D,_,_],
            [_, D, B, B, B, B, B, B, B, B, B, B, B, B, D,_],
            [_, D, B, B, B, B, B, B, B, B, B, B, B, B, D,_],
            [D, B, B, B, E, E, B, W, W, B, E, E, B, B, B, D],
            [D, B, B, B, S, E, B, W, W, B, E, S, B, B, B, D],
            [D, B, B, B, B, B, W, W, W, W, B, B, B, B, B, D],
            [_, D, B, B, B, W, W, N, N, W, W, B, B, B, D,_],
            [_, D, B, C, B, W, W, W, W, W, W, B, C, B, D,_],
            [_,_, D, B, B, B, W, W, W, W, B, B, B, D,_,_],
            [_,_,_, D, D, B, B, B, B, B, B, D, D,_,_,_],
            [_,_, D, P, D, W, W, W, W, W, W, D, P, D,_,_],
            [_, D, P, P, D, W, W, W, W, W, W, D, P, P, D,_],
            [_, D, P, P, D, W, W, W, W, W, W, D, P, P, D,_],
            [_,_, D, D, D, D, W, W, W, W, D, D, D, D,_,_],
            [_,_,_, D, D,_, D, D, D, D,_, D, D,_,_,_],
            [_,_, D, P, P, D,_,_,_,_, D, P, P, D,_,_],
            [_,_, D, D, D, D,_,_,_,_, D, D, D, D,_,_],
          ];
        })(),
      };
    case 5: // Cãozinho (golden dog)
      return {
        palette: {},
        pixels: (() => {
          const [G, W, D, N, E, S, C, P, T, _] = ["#ffcc80", "#fff8e1", "#f57c00", "#37474f", "#111118", "#ffffff", "#ffcccc", "#ff8f00", "#ff6b81", null];
          return [
            [_,_, D, D, D,_,_,_,_,_,_, D, D, D,_,_],
            [_,_, D, P, P, D,_,_,_,_, D, P, P, D,_,_],
            [_,_, D, P, G, G, G, G, G, G, G, G, P, D,_,_],
            [_, D, G, G, G, G, G, G, G, G, G, G, G, G, D,_],
            [_, D, G, G, G, G, G, G, G, G, G, G, G, G, D,_],
            [D, G, G, G, E, E, G, W, W, G, E, E, G, G, G, D],
            [D, G, G, G, S, E, G, W, W, G, E, S, G, G, G, D],
            [D, G, G, G, G, G, W, W, W, W, G, G, G, G, G, D],
            [_, D, G, G, G, W, W, N, N, W, W, G, G, G, D,_],
            [_, D, G, C, G, W, W, W, W, W, W, G, C, G, D,_],
            [_,_, D, G, G, G, W, T, T, W, G, G, G, D,_,_],
            [_,_,_, D, D, G, G, G, G, G, G, D, D,_,_,_],
            [_,_, D, G, D, W, W, W, W, W, W, D, G, D,_,_],
            [_, D, G, G, D, W, W, W, W, W, W, D, G, G, D,_],
            [_, D, G, G, D, W, W, W, W, W, W, D, G, G, D,_],
            [_,_, D, D, D, D, W, W, W, W, D, D, D, D,_,_],
            [_,_,_, D, D,_, D, D, D, D,_, D, D,_,_,_],
            [_,_, D, P, P, D,_,_,_,_, D, P, P, D,_,_],
            [_,_, D, D, D, D,_, G, P, G, D, D, D, D,_,_],
          ];
        })(),
      };
    case 6: // Pinguim (black/white penguin)
      return {
        palette: {},
        pixels: (() => {
          const [B, W, D, N, E, S, C, O, _] = ["#263238", "#ffffff", "#37474f", "#ff6f00", "#111118", "#ffffff", "#ffccdd", "#ff6f00", null]; // eslint-disable-line @typescript-eslint/no-unused-vars
          return [
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_,_,_, D, D, D, D, D, D, D, D,_,_,_,_],
            [_,_,_, D, B, B, B, B, B, B, B, B, D,_,_,_],
            [_,_, D, B, B, B, B, B, B, B, B, B, B, D,_,_],
            [_, D, B, B, E, E, B, B, B, B, E, E, B, B, D,_],
            [_, D, B, B, S, E, B, B, B, B, E, S, B, B, D,_],
            [_, D, B, B, B, B, B, B, B, B, B, B, B, B, D,_],
            [_, D, B, B, B, B, B, O, O, B, B, B, B, B, D,_],
            [_,_, D, B, C, B, B, O, O, B, B, C, B, D,_,_],
            [_,_, D, B, B, B, W, W, W, W, B, B, B, D,_,_],
            [_,_, D, B, B, W, W, W, W, W, W, B, B, D,_,_],
            [_, D, B, D, W, W, W, W, W, W, W, W, D, B, D,_],
            [_, D, B, D, W, W, W, W, W, W, W, W, D, B, D,_],
            [_,_, D, D, W, W, W, W, W, W, W, W, D, D,_,_],
            [_,_,_, D, D, W, W, W, W, W, W, D, D,_,_,_],
            [_,_,_,_, D, D, D, D, D, D, D, D,_,_,_,_],
            [_,_,_, D, O, O, D,_,_, D, O, O, D,_,_,_],
            [_,_,_, D, D, D, D,_,_, D, D, D, D,_,_,_],
          ];
        })(),
      };
    case 7: // Hamster (orange round)
      return {
        palette: {},
        pixels: (() => {
          const [O, W, D, N, E, S, C, P, _] = ["#ffb74d", "#ffffff", "#f57c00", "#ff6b81", "#111118", "#ffffff", "#ffab91", "#ff9800", null];
          return [
            [_,_,_,_, D, D,_,_,_,_, D, D,_,_,_,_],
            [_,_,_, D, P, P, D,_,_, D, P, P, D,_,_,_],
            [_,_,_, D, O, O, O, O, O, O, O, O, D,_,_,_],
            [_,_, D, O, O, O, O, O, O, O, O, O, O, D,_,_],
            [_, D, O, O, O, O, O, O, O, O, O, O, O, O, D,_],
            [D, O, O, O, E, E, O, O, O, O, E, E, O, O, O, D],
            [D, O, O, O, S, E, O, O, O, O, E, S, O, O, O, D],
            [D, O, C, C, O, O, O, O, O, O, O, O, C, C, O, D],
            [D, O, C, C, O, O, O, N, N, O, O, O, C, C, O, D],
            [_, D, O, O, O, O, O, O, O, O, O, O, O, O, D,_],
            [_,_, D, O, O, O, O, O, O, O, O, O, O, D,_,_],
            [_,_,_, D, D, O, O, O, O, O, O, D, D,_,_,_],
            [_,_,_, D, D, W, W, W, W, W, W, D, D,_,_,_],
            [_,_, D, O, D, W, W, W, W, W, W, D, O, D,_,_],
            [_,_, D, O, D, W, W, W, W, W, W, D, O, D,_,_],
            [_,_,_, D, D, D, W, W, W, W, D, D, D,_,_,_],
            [_,_,_,_, D,_, D, D, D, D,_, D,_,_,_,_],
            [_,_,_, D, P, D,_,_,_,_, D, P, D,_,_,_],
            [_,_,_, D, D, D,_,_,_,_, D, D, D,_,_,_],
          ];
        })(),
      };
    case 8: // Coala (grey)
      return {
        palette: {},
        pixels: (() => {
          const [G, W, D, N, E, S, C, P, _] = ["#78909c", "#eceff1", "#455a64", "#263238", "#111118", "#ffffff", "#f8bbd0", "#546e7a", null];
          return [
            [_,_, D, D, D,_,_,_,_,_,_, D, D, D,_,_],
            [_, D, P, C, P, D,_,_,_,_, D, P, C, P, D,_],
            [_, D, D, D, D, G, G, G, G, G, G, D, D, D, D,_],
            [_, D, G, G, G, G, G, G, G, G, G, G, G, G, D,_],
            [_, D, G, G, G, G, G, G, G, G, G, G, G, G, D,_],
            [D, G, G, G, E, E, G, W, W, G, E, E, G, G, G, D],
            [D, G, G, G, S, E, G, W, W, G, E, S, G, G, G, D],
            [D, G, G, G, G, G, W, W, W, W, G, G, G, G, G, D],
            [_, D, G, G, G, W, W, N, N, W, W, G, G, G, D,_],
            [_, D, G, C, G, W, W, W, W, W, W, G, C, G, D,_],
            [_,_, D, G, G, G, W, W, W, W, G, G, G, D,_,_],
            [_,_,_, D, D, G, G, G, G, G, G, D, D,_,_,_],
            [_,_, D, P, D, W, W, W, W, W, W, D, P, D,_,_],
            [_, D, P, P, D, W, W, W, W, W, W, D, P, P, D,_],
            [_, D, P, P, D, W, W, W, W, W, W, D, P, P, D,_],
            [_,_, D, D, D, D, W, W, W, W, D, D, D, D,_,_],
            [_,_,_, D, D,_, D, D, D, D,_, D, D,_,_,_],
            [_,_, D, P, P, D,_,_,_,_, D, P, P, D,_,_],
            [_,_, D, D, D, D,_,_,_,_, D, D, D, D,_,_],
          ];
        })(),
      };
    case 9: // Coruja (brown owl)
      return {
        palette: {},
        pixels: (() => {
          const [B, W, D, N, E, S, C, P, _] = ["#6d4c41", "#d7ccc8", "#4e342e", "#ff8f00", "#111118", "#ffffff", "#ffccbc", "#3e2723", null];
          return [
            [_,_,_, D, D,_,_,_,_,_,_, D, D,_,_,_],
            [_,_, D, P, P, D,_,_,_,_, D, P, P, D,_,_],
            [_,_, D, B, B, B, B, B, B, B, B, B, B, D,_,_],
            [_, D, B, B, B, B, B, B, B, B, B, B, B, B, D,_],
            [_, D, B, W, W, W, B, B, B, B, W, W, W, B, D,_],
            [D, B, W, W, E, E, W, B, B, W, E, E, W, W, B, D],
            [D, B, W, W, S, E, W, B, B, W, E, S, W, W, B, D],
            [D, B, B, W, W, W, B, B, B, B, W, W, W, B, B, D],
            [_, D, B, B, B, B, B, N, N, B, B, B, B, B, D,_],
            [_, D, B, C, B, B, B, N, N, B, B, B, C, B, D,_],
            [_,_, D, B, B, B, B, B, B, B, B, B, B, D,_,_],
            [_,_,_, D, D, B, B, B, B, B, B, D, D,_,_,_],
            [_,_, D, B, D, W, W, W, W, W, W, D, B, D,_,_],
            [_, D, B, B, D, W, W, W, W, W, W, D, B, B, D,_],
            [D, B, B, B, D, W, W, W, W, W, W, D, B, B, B, D],
            [_, D, D, D, D, D, W, W, W, W, D, D, D, D, D,_],
            [_,_,_,_, D,_, D, D, D, D,_, D,_,_,_,_],
            [_,_,_, D, P, D,_,_,_,_, D, P, D,_,_,_],
            [_,_,_, D, D, D,_,_,_,_, D, D, D,_,_,_],
          ];
        })(),
      };
    case 10: // Sapinho (green frog)
      return {
        palette: {},
        pixels: (() => {
          const [G, W, D, N, E, S, C, P, _] = ["#66bb6a", "#e8f5e9", "#388e3c", "#2e7d32", "#111118", "#ffffff", "#ff8a80", "#43a047", null];
          return [
            [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
            [_,_, D, D, D,_,_,_,_,_,_, D, D, D,_,_],
            [_, D, G, E, G, D,_,_,_,_, D, G, E, G, D,_],
            [_, D, G, S, G, D, D, D, D, D, D, G, S, G, D,_],
            [_, D, D, D, D, G, G, G, G, G, G, D, D, D, D,_],
            [_,_, D, G, G, G, G, G, G, G, G, G, G, D,_,_],
            [_, D, G, G, G, G, G, G, G, G, G, G, G, G, D,_],
            [D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D],
            [D, G, G, G, G, G, G, N, N, G, G, G, G, G, G, D],
            [_, D, G, C, G, G, G, G, G, G, G, G, C, G, D,_],
            [_,_, D, G, G, G, D, D, D, D, G, G, G, D,_,_],
            [_,_,_, D, D, G, G, G, G, G, G, D, D,_,_,_],
            [_,_,_, D, D, W, W, W, W, W, W, D, D,_,_,_],
            [_,_, D, G, D, W, W, W, W, W, W, D, G, D,_,_],
            [_,_, D, G, D, W, W, W, W, W, W, D, G, D,_,_],
            [_,_,_, D, D, D, W, W, W, W, D, D, D,_,_,_],
            [_,_,_, D,_,_, D, D, D, D,_,_, D,_,_,_],
            [_,_, D, P, P, D,_,_,_,_, D, P, P, D,_,_],
            [_,_, D, D, D, D,_,_,_,_, D, D, D, D,_,_],
          ];
        })(),
      };
    default:
      return getPixelGrid(0); // fallback to panda
  }
}

function PixelAnimal({ size, animalId, idle, eyes, mouth, top, bottom: _bottom, accessory }: { size: number; animalId: number; idle: string; eyes: typeof EYE_STYLES[0]; mouth: typeof MOUTH_STYLES[0]; top: typeof TOP_STYLES[0]; bottom: typeof BOTTOM_STYLES[0]; accessory: typeof ACCESSORY_STYLES[0] }) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const p = size / 16;
  const { pixels } = getPixelGrid(animalId);
  const idleClass = `avatar-idle-${idle}`;

  // Eye pixel positions: In all grids, eyes use "#111118" (pupil/E) and "#ffffff" (shine/S)
  // We replace those with the selected eye colors
  const E_COLOR = "#111118";
  const S_COLOR = "#ffffff";

  // Determine which pixels are left eye vs right eye (left = x < 8, right = x >= 8)
  const getPixelColor = (color: string, x: number, y: number): string => {
    if (color === E_COLOR) {
      // Pupil — use eye color (iris around pupil)
      const isRight = x >= 8;
      if (isRight && "rightEyeColor" in eyes && eyes.rightEyeColor) {
        return eyes.rightEyeColor;
      }
      return eyes.eyeColor;
    }
    if (color === S_COLOR && y >= 5 && y <= 7) {
      // Shine pixel in eye area — keep white for sparkle
      return eyes.shineColor;
    }
    return color;
  };

  return (
    <div className={`relative ${idleClass}`} style={{ width: `${size}px`, height: `${size}px` }}>
      {/* Ground shadow */}
      <div className="absolute rounded-full" style={{ bottom: `${0.5*p}px`, left: "20%", width: "60%", height: `${1.2*p}px`, background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)", filter: `blur(${p*0.3}px)` }} />

      {/* Pixel grid */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: `${16*p}px`, height: `${19*p}px`, imageRendering: "pixelated" }}>
        {pixels.map((row, y) => (
          row.map((color, x) => {
            if (!color) return null;
            const finalColor = getPixelColor(color, x, y);
            return (
              <div
                key={`${x}-${y}`}
                className="absolute"
                style={{
                  left: `${x * p}px`,
                  top: `${y * p}px`,
                  width: `${p + 0.5}px`,
                  height: `${p + 0.5}px`,
                  backgroundColor: finalColor,
                }}
              />
            );
          })
        ))}
      </div>

      {/* 8-bit Mouth overlay — positioned at row 9-10, centered (x 6-9) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: `${16*p}px`, height: `${19*p}px` }}>
        <PixelMouth type={mouth.type} p={p} />
      </div>

      {/* Clothing overlay (top) */}
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
          <div className="relative" style={{ width: `${5*p}px`, height: `${2*p}px` }}>
            <div style={{ width: `${5*p}px`, height: `${p}px`, backgroundColor: "#ffd700", position: "absolute", bottom: 0 }} />
            <div className="absolute" style={{ left: `${0}px`, top: `0`, width: `${p}px`, height: `${p}px`, backgroundColor: "#ffd700" }} />
            <div className="absolute" style={{ left: `${2*p}px`, top: `${-0.5*p}px`, width: `${p}px`, height: `${p}px`, backgroundColor: "#ffed4a" }} />
            <div className="absolute" style={{ left: `${4*p}px`, top: `0`, width: `${p}px`, height: `${p}px`, backgroundColor: "#ffd700" }} />
          </div>
        </div>
      )}
      {accessory.type === "bow" && (
        <div className="absolute" style={{ top: `calc(50% - ${9*p}px)`, left: `calc(50% + ${4*p}px)` }}>
          <div style={{ width: `${2*p}px`, height: `${2*p}px`, backgroundColor: "#e91e63", borderRadius: "2px" }} />
        </div>
      )}
      {accessory.type === "wizard_hat" && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `calc(50% - ${9.5*p}px - ${3*p}px)` }}>
          <div className="relative" style={{ width: `${5*p}px`, height: `${3*p}px` }}>
            <div className="absolute" style={{ left: `${2*p}px`, top: 0, width: `${p}px`, height: `${p}px`, backgroundColor: "#4a148c" }} />
            <div className="absolute" style={{ left: `${p}px`, top: `${p}px`, width: `${3*p}px`, height: `${p}px`, backgroundColor: "#6a1b9a" }} />
            <div className="absolute" style={{ left: 0, top: `${2*p}px`, width: `${5*p}px`, height: `${p}px`, backgroundColor: "#ffd54f" }} />
          </div>
        </div>
      )}
      {accessory.type === "flowers" && (
        <div className="absolute" style={{ top: `calc(50% - ${8*p}px)`, left: `calc(50% + ${5*p}px)` }}>
          <div style={{ width: `${p}px`, height: `${p}px`, backgroundColor: "#f48fb1" }} />
          <div className="absolute" style={{ top: `${-p}px`, left: `${p}px`, width: `${p}px`, height: `${p}px`, backgroundColor: "#e91e63" }} />
        </div>
      )}
      {accessory.type === "glasses" && (
        <div className="absolute left-1/2 -translate-x-1/2 flex" style={{ top: `calc(50% - ${4.5*p}px)`, gap: `${p}px` }}>
          <div style={{ width: `${2*p}px`, height: `${2*p}px`, border: `${p*0.4}px solid #37474f`, borderRadius: "1px" }} />
          <div style={{ width: `${2*p}px`, height: `${2*p}px`, border: `${p*0.4}px solid #37474f`, borderRadius: "1px" }} />
        </div>
      )}
      {accessory.type === "scarf" && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `calc(50% + ${1.5*p}px)` }}>
          <div style={{ width: `${6*p}px`, height: `${p}px`, backgroundColor: "#e91e63" }} />
          <div className="absolute" style={{ top: `${p}px`, right: 0, width: `${p}px`, height: `${2*p}px`, backgroundColor: "#c2185b" }} />
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

  // All animals use 8-bit pixel art renderer
  return <PixelAnimal size={size} animalId={animal.id} idle={animal.idle} eyes={eyes} mouth={mouth} top={top} bottom={bottom} accessory={accessory} />;

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

// ─── 3D Eye (legacy — unused, kept for compat) ──────────────────────────

function AnimeEye3D({ style, scale: s, isRight }: { style: typeof EYE_STYLES[0]; scale: number; isRight?: boolean }) {
  const eyeColor = isRight && "rightEyeColor" in style && style.rightEyeColor ? style.rightEyeColor : style.eyeColor;
  return (
    <div className="relative" style={{ width: `${16*s}px`, height: `${18*s}px` }}>
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: "45%", background: "linear-gradient(180deg, #ffffff, #f0f0f5)", border: `${1.5*s}px solid #37474f` }}>
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ top: `${3*s}px`, width: `${11*s}px`, height: `${12*s}px`, background: eyeColor }} />
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ top: `${5.5*s}px`, width: `${5.5*s}px`, height: `${6*s}px`, background: style.pupilColor }} />
        <div className="absolute rounded-full bg-white" style={{ top: `${3*s}px`, left: `${3.5*s}px`, width: `${4*s}px`, height: `${4*s}px` }} />
      </div>
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Tail({ type, color, scale: s }: { type: string; color: string; scale: number }) {
  // Now delegated to TailEnhanced — this is unused but kept for compat
  if (type === "none") return null;
  return null;
}

// ─── 3D Accessory ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function EyePreviewSmall({ style }: { style: typeof EYE_STYLES[0] }) {
  return <EyePreview8bit style={style} />;
}

function EyePreview8bit({ style }: { style: typeof EYE_STYLES[0] }) {
  // 8-bit pixel eye preview: 4x4 grid showing eye color
  const p = 5; // pixel size for preview
  return (
    <div className="relative" style={{ width: `${4*p}px`, height: `${4*p}px`, imageRendering: "pixelated" }}>
      {/* White of eye */}
      <div className="absolute" style={{ left: `${p}px`, top: 0, width: `${2*p}px`, height: `${p}px`, backgroundColor: "#ffffff" }} />
      <div className="absolute" style={{ left: 0, top: `${p}px`, width: `${4*p}px`, height: `${2*p}px`, backgroundColor: "#ffffff" }} />
      <div className="absolute" style={{ left: `${p}px`, top: `${3*p}px`, width: `${2*p}px`, height: `${p}px`, backgroundColor: "#ffffff" }} />
      {/* Iris */}
      <div className="absolute" style={{ left: `${p}px`, top: `${p}px`, width: `${2*p}px`, height: `${2*p}px`, backgroundColor: style.eyeColor }} />
      {/* Pupil */}
      <div className="absolute" style={{ left: `${2*p}px`, top: `${2*p}px`, width: `${p}px`, height: `${p}px`, backgroundColor: style.pupilColor }} />
      {/* Shine */}
      <div className="absolute" style={{ left: `${p}px`, top: `${p}px`, width: `${p}px`, height: `${p}px`, backgroundColor: style.shineColor }} />
      {/* Outline */}
      <div className="absolute inset-0 border border-purple-700/30 rounded-sm" />
    </div>
  );
}

// ─── 8-bit Pixel Mouth Component ─────────────────────────────

function PixelMouth({ type, p }: { type: string; p: number }) {
  // Mouth pixels positioned at row 9-10 area of the 16x19 grid
  // Each mouth is a small pixel pattern (4-6px wide) centered at x=6-9, y=9-10
  const M = "#5d4037"; // mouth line color (dark brown)
  const R = "#ef5350"; // tongue/inside red
  const W = "#ffffff"; // teeth white
  const P = "#ff8a9e"; // pink (tongue light)

  // For preview mode (small p), render at 0,0 relative; for sprite mode, render at row 9
  const isPreview = p <= 5;
  const offsetY = isPreview ? 0 : 9 * p;
  const offsetX = isPreview ? 0 : 6 * p;

  const renderPixels = (pixels: { x: number; y: number; c: string }[]) => (
    <div className="relative" style={{ width: `${4*p}px`, height: `${2*p}px`, left: isPreview ? 0 : undefined }}>
      {pixels.map((px, i) => (
        <div key={i} className="absolute" style={{ left: `${px.x * p}px`, top: `${px.y * p}px`, width: `${p + 0.3}px`, height: `${p + 0.3}px`, backgroundColor: px.c }} />
      ))}
    </div>
  );

  const mouthPixels: Record<string, { x: number; y: number; c: string }[]> = {
    // Sorriso: curved smile ◡
    smile: [
      { x: 0, y: 0, c: M }, { x: 3, y: 0, c: M },
      { x: 1, y: 1, c: M }, { x: 2, y: 1, c: M },
    ],
    // Aberto: open mouth with dark inside
    open: [
      { x: 0, y: 0, c: M }, { x: 1, y: 0, c: M }, { x: 2, y: 0, c: M }, { x: 3, y: 0, c: M },
      { x: 0, y: 1, c: M }, { x: 1, y: 1, c: R }, { x: 2, y: 1, c: R }, { x: 3, y: 1, c: M },
    ],
    // Gatinho: ω shape (anime cat mouth)
    cat: [
      { x: 0, y: 0, c: M }, { x: 3, y: 0, c: M },
      { x: 0, y: 1, c: M }, { x: 1, y: 1, c: M }, { x: 2, y: 1, c: M }, { x: 3, y: 1, c: M },
      { x: 1, y: 0, c: M },
    ],
    // Surpreso: small O
    o: [
      { x: 1, y: 0, c: M }, { x: 2, y: 0, c: M },
      { x: 0, y: 0, c: M }, { x: 3, y: 0, c: M },
      { x: 1, y: 1, c: M }, { x: 2, y: 1, c: M },
    ],
    // Tímido: small line —
    line: [
      { x: 1, y: 0, c: M }, { x: 2, y: 0, c: M },
    ],
    // Dentes: open smile showing teeth
    teeth: [
      { x: 0, y: 0, c: M }, { x: 1, y: 0, c: M }, { x: 2, y: 0, c: M }, { x: 3, y: 0, c: M },
      { x: 0, y: 1, c: M }, { x: 1, y: 1, c: W }, { x: 2, y: 1, c: W }, { x: 3, y: 1, c: M },
    ],
    // Língua: smile with tongue sticking out
    tongue: [
      { x: 0, y: 0, c: M }, { x: 3, y: 0, c: M },
      { x: 1, y: 1, c: M }, { x: 2, y: 1, c: P },
    ],
  };

  const pixels = mouthPixels[type] || mouthPixels.smile;

  if (isPreview) {
    return renderPixels(pixels);
  }

  // Sprite overlay mode — position within the 16x19 grid
  return (
    <div className="absolute" style={{ left: `${offsetX}px`, top: `${offsetY}px`, width: `${4*p}px`, height: `${2*p}px` }}>
      {pixels.map((px, i) => (
        <div key={i} className="absolute" style={{ left: `${px.x * p}px`, top: `${px.y * p}px`, width: `${p + 0.3}px`, height: `${p + 0.3}px`, backgroundColor: px.c }} />
      ))}
    </div>
  );
}

function MouthPreviewSmall({ type }: { type: string }) {
  // 8-bit pixel mouth preview
  return <PixelMouth type={type} p={4} />;
}

function AccessoryPreviewSmall({ type }: { type: string }) {
  const emojis: Record<string, string> = { none: "✕", bow: "🎀", crown: "👑", wizard_hat: "🧙", flowers: "🌸", glasses: "👓", scarf: "🧣" };
  return <span className="text-xl">{emojis[type] || "✕"}</span>;
}

function EffectPreviewSmall({ type }: { type: string }) {
  const emojis: Record<string, string> = { none: "✕", stars: "⭐", hearts: "💕", sparkles: "✨", bubbles: "🫧", snow: "❄️", pixels: "▪️" };
  return <span className="text-xl">{emojis[type] || "✕"}</span>;
}

// ─── Biome Overlay ────────────────────────────────────────────

function BiomeOverlay({ biome }: { biome: string }) {
  const pixelStyle = (left: string, bottom: string, color: string, w = "4px", h = "4px") => ({
    position: "absolute" as const, left, bottom, width: w, height: h, backgroundColor: color,
  });

  switch (biome) {
    case "forest":
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Trees */}
          <div style={pixelStyle("10%", "20%", "#0a5c1e", "8px", "24px")} />
          <div style={pixelStyle("8%", "44%", "#1a8c3a", "12px", "8px")} />
          <div style={pixelStyle("9%", "52%", "#15732e", "10px", "6px")} />
          <div style={pixelStyle("80%", "25%", "#0a5c1e", "8px", "20px")} />
          <div style={pixelStyle("78%", "45%", "#1a8c3a", "12px", "8px")} />
          <div style={pixelStyle("79%", "53%", "#15732e", "10px", "6px")} />
          <div style={pixelStyle("45%", "15%", "#0a5c1e", "6px", "16px")} />
          <div style={pixelStyle("43%", "31%", "#22a044", "10px", "6px")} />
          {/* Grass floor */}
          <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-t from-[#1a5c32] to-transparent" />
          <div style={pixelStyle("15%", "2%", "#2d8c4a", "6px", "6px")} />
          <div style={pixelStyle("35%", "4%", "#22a044", "4px", "4px")} />
          <div style={pixelStyle("60%", "1%", "#2d8c4a", "5px", "5px")} />
          <div style={pixelStyle("75%", "3%", "#1a6e35", "4px", "6px")} />
        </div>
      );
    case "ocean":
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Waves */}
          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[#0a3a6a] to-transparent opacity-60" />
          <div className="absolute bottom-[35%] left-0 right-0 h-[4px] bg-[#3a8ad4]/30" style={{ borderRadius: "50%" }} />
          <div className="absolute bottom-[28%] left-[10%] right-[10%] h-[3px] bg-[#5aace8]/20" style={{ borderRadius: "50%" }} />
          <div className="absolute bottom-[20%] left-[5%] right-[15%] h-[3px] bg-[#3a8ad4]/25" style={{ borderRadius: "50%" }} />
          {/* Bubbles */}
          <div style={pixelStyle("20%", "10%", "#5aace8", "4px", "4px")} className="rounded-full opacity-40" />
          <div style={pixelStyle("70%", "15%", "#7ac4f0", "3px", "3px")} className="rounded-full opacity-30" />
          <div style={pixelStyle("40%", "8%", "#5aace8", "5px", "5px")} className="rounded-full opacity-35" />
          {/* Fish pixel */}
          <div style={pixelStyle("25%", "18%", "#ffaa33", "6px", "3px")} />
          <div style={pixelStyle("23%", "19%", "#ffaa33", "2px", "2px")} />
        </div>
      );
    case "desert":
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Sand dunes */}
          <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t from-[#d4a055] to-transparent" />
          <div className="absolute bottom-[20%] left-[5%] w-[40%] h-[12%] bg-[#c2956b] rounded-t-full opacity-50" />
          <div className="absolute bottom-[18%] right-[10%] w-[35%] h-[10%] bg-[#b8864a] rounded-t-full opacity-40" />
          {/* Cactus */}
          <div style={pixelStyle("75%", "25%", "#2d7a2d", "4px", "16px")} />
          <div style={pixelStyle("73%", "35%", "#2d7a2d", "4px", "4px")} />
          <div style={pixelStyle("77%", "30%", "#2d7a2d", "4px", "4px")} />
          {/* Sun */}
          <div className="absolute top-[10%] right-[15%] w-[20px] h-[20px] bg-[#ffcc00] rounded-full opacity-60" />
        </div>
      );
    case "snow":
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Snow ground */}
          <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-white/80 to-transparent" />
          {/* Snow hills */}
          <div className="absolute bottom-[15%] left-[0%] w-[50%] h-[10%] bg-white/50 rounded-t-full" />
          <div className="absolute bottom-[12%] right-[0%] w-[40%] h-[8%] bg-white/40 rounded-t-full" />
          {/* Snowflakes */}
          <div style={pixelStyle("15%", "70%", "#ffffff", "3px", "3px")} className="opacity-60" />
          <div style={pixelStyle("45%", "80%", "#ffffff", "2px", "2px")} className="opacity-50" />
          <div style={pixelStyle("70%", "65%", "#ffffff", "3px", "3px")} className="opacity-40" />
          <div style={pixelStyle("30%", "55%", "#ffffff", "2px", "2px")} className="opacity-50" />
          {/* Pine tree */}
          <div style={pixelStyle("85%", "20%", "#2d5a3a", "6px", "18px")} />
          <div style={pixelStyle("83%", "38%", "#3a7a4a", "10px", "6px")} />
          <div style={pixelStyle("84%", "44%", "#2d6a3e", "8px", "5px")} />
        </div>
      );
    case "volcano":
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Volcano shape */}
          <div className="absolute bottom-0 left-[20%] w-0 h-0" style={{ borderLeft: "60px solid transparent", borderRight: "60px solid transparent", borderBottom: "80px solid #3a1a0a" }} />
          {/* Lava glow */}
          <div className="absolute bottom-[60%] left-[43%] w-[14%] h-[6%] bg-[#ff4400] rounded-full opacity-50 blur-sm" />
          <div className="absolute bottom-[55%] left-[45%] w-[10%] h-[4%] bg-[#ffaa00] rounded-full opacity-40" />
          {/* Lava floor */}
          <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-gradient-to-t from-[#ff4400]/30 to-transparent" />
          {/* Embers */}
          <div style={pixelStyle("35%", "65%", "#ff6600", "3px", "3px")} className="opacity-60" />
          <div style={pixelStyle("55%", "70%", "#ffaa00", "2px", "2px")} className="opacity-50" />
          <div style={pixelStyle("42%", "75%", "#ff4400", "2px", "2px")} className="opacity-40" />
        </div>
      );
    case "sky":
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Clouds */}
          <div className="absolute top-[15%] left-[10%] w-[30%] h-[10%] bg-white/60 rounded-full blur-[2px]" />
          <div className="absolute top-[12%] left-[18%] w-[20%] h-[8%] bg-white/50 rounded-full blur-[1px]" />
          <div className="absolute top-[30%] right-[15%] w-[25%] h-[8%] bg-white/40 rounded-full blur-[2px]" />
          <div className="absolute top-[28%] right-[20%] w-[15%] h-[6%] bg-white/50 rounded-full" />
          {/* Sun */}
          <div className="absolute top-[8%] right-[10%] w-[24px] h-[24px] bg-[#ffd700] rounded-full opacity-70 shadow-lg shadow-yellow-400/30" />
          {/* Ground - grass */}
          <div className="absolute bottom-0 left-0 right-0 h-[12%] bg-gradient-to-t from-[#4a8c3a] to-[#6aac5a]" />
        </div>
      );
    case "space":
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Stars */}
          <div style={pixelStyle("10%", "80%", "#ffffff", "2px", "2px")} className="opacity-80" />
          <div style={pixelStyle("25%", "70%", "#ffffff", "1px", "1px")} className="opacity-60" />
          <div style={pixelStyle("40%", "85%", "#aaccff", "2px", "2px")} className="opacity-70" />
          <div style={pixelStyle("60%", "75%", "#ffffff", "1px", "1px")} className="opacity-50" />
          <div style={pixelStyle("75%", "90%", "#ffddaa", "2px", "2px")} className="opacity-60" />
          <div style={pixelStyle("85%", "65%", "#ffffff", "1px", "1px")} className="opacity-70" />
          <div style={pixelStyle("50%", "60%", "#aaddff", "2px", "2px")} className="opacity-40" />
          <div style={pixelStyle("15%", "50%", "#ffffff", "1px", "1px")} className="opacity-50" />
          <div style={pixelStyle("90%", "45%", "#ffccaa", "2px", "2px")} className="opacity-60" />
          {/* Planet */}
          <div className="absolute top-[12%] left-[15%] w-[28px] h-[28px] bg-gradient-to-br from-[#6a4aaa] to-[#3a2a6a] rounded-full opacity-60" />
          <div className="absolute top-[14%] left-[17%] w-[8px] h-[3px] bg-[#9a7acc]/40 rounded-full" />
          {/* Nebula glow */}
          <div className="absolute top-[40%] right-[20%] w-[40%] h-[30%] bg-[#5533aa]/10 rounded-full blur-xl" />
        </div>
      );
    default:
      return null;
  }
}

// ─── Avatar Background Effects ───────────────────────────────

function AvatarEffect({ type }: { type: string }) {
  switch (type) {
    case "stars":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute animate-sparkle text-white/40" style={{ top: `${10 + (i * 11) % 70}%`, left: `${5 + (i * 17) % 85}%`, fontSize: `${8 + (i % 3) * 4}px`, animationDelay: `${i * 0.4}s` }}>✦</div>
          ))}
        </div>
      );
    case "hearts":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute avatar-float text-pink-300/40" style={{ top: `${15 + (i * 13) % 60}%`, left: `${8 + (i * 19) % 80}%`, fontSize: `${10 + (i % 3) * 3}px`, animationDelay: `${i * 0.6}s` }}>♥</div>
          ))}
        </div>
      );
    case "sparkles":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="absolute animate-sparkle" style={{ top: `${5 + (i * 9) % 80}%`, left: `${3 + (i * 13) % 90}%`, fontSize: `${6 + (i % 4) * 3}px`, color: ["#ffd700", "#ffffff", "#ff69b4", "#87ceeb"][i % 4], opacity: 0.4, animationDelay: `${i * 0.3}s` }}>✧</div>
          ))}
        </div>
      );
    case "bubbles":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="absolute avatar-float rounded-full border border-white/20" style={{ bottom: `${-10 + (i * 5)}%`, left: `${10 + (i * 14) % 75}%`, width: `${8 + (i % 3) * 6}px`, height: `${8 + (i % 3) * 6}px`, background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent)", animationDelay: `${i * 0.5}s`, animationDuration: `${3 + i * 0.5}s` }} />
          ))}
        </div>
      );
    case "snow":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute avatar-snow text-white/30" style={{ top: `${-5 + (i * 3)}%`, left: `${5 + (i * 8) % 88}%`, fontSize: `${5 + (i % 3) * 3}px`, animationDelay: `${i * 0.4}s`, animationDuration: `${4 + (i % 3)}s` }}>•</div>
          ))}
        </div>
      );
    case "pixels":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="absolute animate-sparkle" style={{ top: `${(i * 7) % 90}%`, left: `${(i * 11) % 90}%`, width: `${3 + (i % 2) * 2}px`, height: `${3 + (i % 2) * 2}px`, backgroundColor: ["#ff69b4", "#87ceeb", "#98fb98", "#ffd700", "#dda0dd"][i % 5], opacity: 0.3, animationDelay: `${i * 0.25}s` }} />
          ))}
        </div>
      );
    default:
      return null;
  }
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
