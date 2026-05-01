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

// 11 cute anime animals
const ANIMALS = [
  { id: 0, name: "Panda", emoji: "🐼", bodyColor: "#2d2d3a", bellyColor: "#ffffff", earColor: "#1a1a2e", pawColor: "#1a1a2e", cheekColor: "#ffb3d9", noseColor: "#333333", tailType: "round" },
  { id: 1, name: "Gatinho", emoji: "🐱", bodyColor: "#ff9f43", bellyColor: "#fff3e0", earColor: "#e67e22", pawColor: "#d35400", cheekColor: "#ffcccc", noseColor: "#ff6b81", tailType: "long" },
  { id: 2, name: "Coelhinho", emoji: "🐰", bodyColor: "#fce4ec", bellyColor: "#ffffff", earColor: "#f8bbd0", pawColor: "#f48fb1", cheekColor: "#ff8a9e", noseColor: "#ff6b81", tailType: "puff" },
  { id: 3, name: "Raposa", emoji: "🦊", bodyColor: "#ff6b35", bellyColor: "#fff8e1", earColor: "#e55100", pawColor: "#bf360c", cheekColor: "#ffab91", noseColor: "#37474f", tailType: "fluffy" },
  { id: 4, name: "Ursinho", emoji: "🐻", bodyColor: "#8d6e63", bellyColor: "#d7ccc8", earColor: "#6d4c41", pawColor: "#5d4037", cheekColor: "#ffccbc", noseColor: "#3e2723", tailType: "round" },
  { id: 5, name: "Cãozinho", emoji: "🐶", bodyColor: "#ffcc80", bellyColor: "#fff8e1", earColor: "#ff8f00", pawColor: "#f57c00", cheekColor: "#ffcccc", noseColor: "#37474f", tailType: "wagging" },
  { id: 6, name: "Pinguim", emoji: "🐧", bodyColor: "#263238", bellyColor: "#ffffff", earColor: "#263238", pawColor: "#ff6f00", cheekColor: "#ffccdd", noseColor: "#ff6f00", tailType: "small" },
  { id: 7, name: "Hamster", emoji: "🐹", bodyColor: "#ffb74d", bellyColor: "#ffffff", earColor: "#ff9800", pawColor: "#f57c00", cheekColor: "#ffab91", noseColor: "#ff6b81", tailType: "tiny" },
  { id: 8, name: "Coala", emoji: "🐨", bodyColor: "#78909c", bellyColor: "#eceff1", earColor: "#546e7a", pawColor: "#455a64", cheekColor: "#f8bbd0", noseColor: "#263238", tailType: "none" },
  { id: 9, name: "Coruja", emoji: "🦉", bodyColor: "#6d4c41", bellyColor: "#d7ccc8", earColor: "#4e342e", pawColor: "#3e2723", cheekColor: "#ffccbc", noseColor: "#ff8f00", tailType: "feathers" },
  { id: 10, name: "Sapinho", emoji: "🐸", bodyColor: "#66bb6a", bellyColor: "#e8f5e9", earColor: "#43a047", pawColor: "#388e3c", cheekColor: "#ff8a80", noseColor: "#2e7d32", tailType: "none" },
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
}

export default function AvatarBuilder({ owner }: AvatarBuilderProps) {
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

// ─── 3D Anime Animal Character ────────────────────────────────

function AnimeAnimalCharacter({ config, size }: { config: AvatarConfig; size: number }) {
  const animal = ANIMALS[config.animal] || ANIMALS[0];
  const eyes = EYE_STYLES[config.eyes] || EYE_STYLES[0];
  const mouth = MOUTH_STYLES[config.mouth] || MOUTH_STYLES[0];
  const top = TOP_STYLES[config.top] || TOP_STYLES[0];
  const bottom = BOTTOM_STYLES[config.bottom] || BOTTOM_STYLES[0];
  const accessory = ACCESSORY_STYLES[config.accessory] || ACCESSORY_STYLES[0];
  const s = size / 240; // scale factor

  return (
    <div className="relative animate-breathe" style={{ width: `${size}px`, height: `${size}px` }}>
      {/* Shadow on ground */}
      <div className="absolute rounded-full opacity-20" style={{ bottom: `${8*s}px`, left: "25%", width: "50%", height: `${12*s}px`, background: "radial-gradient(ellipse, #000 0%, transparent 70%)" }} />

      {/* Tail */}
      <Tail type={animal.tailType} color={animal.bodyColor} scale={s} />

      {/* Legs / Bottom clothing */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${18*s}px` }}>
        <div className="flex gap-1" style={{ gap: `${6*s}px` }}>
          <div className="rounded-b-full shadow-md" style={{ width: `${22*s}px`, height: `${40*s}px`, background: `linear-gradient(180deg, ${bottom.color}, ${bottom.secondary})`, border: `1.5px solid ${bottom.color}88` }} />
          <div className="rounded-b-full shadow-md" style={{ width: `${22*s}px`, height: `${40*s}px`, background: `linear-gradient(180deg, ${bottom.color}, ${bottom.secondary})`, border: `1.5px solid ${bottom.color}88` }} />
        </div>
        {/* Paws/feet */}
        <div className="flex justify-between" style={{ marginTop: `-${2*s}px`, padding: `0 ${2*s}px` }}>
          <div className="rounded-full" style={{ width: `${18*s}px`, height: `${10*s}px`, background: animal.pawColor }} />
          <div className="rounded-full" style={{ width: `${18*s}px`, height: `${10*s}px`, background: animal.pawColor }} />
        </div>
      </div>

      {/* Body / Top clothing */}
      <div
        className="absolute left-1/2 -translate-x-1/2 shadow-lg"
        style={{
          top: `${82*s}px`,
          width: `${72*s}px`,
          height: `${80*s}px`,
          borderRadius: "40% 40% 35% 35%",
          background: `linear-gradient(180deg, ${top.color} 0%, ${top.secondary} 100%)`,
          border: `2px solid ${top.color}66`,
          boxShadow: `inset 0 ${4*s}px ${12*s}px rgba(255,255,255,0.15), 0 ${4*s}px ${12*s}px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Clothing detail */}
        {top.pattern === "collar" && <div className="absolute top-1 left-1/2 -translate-x-1/2 border-b-[6px] border-l-[8px] border-r-[8px] border-transparent border-b-white" style={{ top: `${2*s}px` }} />}
        {top.pattern === "stripes" && <div className="absolute left-0 right-0 flex flex-col gap-1 overflow-hidden rounded-[inherit] opacity-30" style={{ top: `${20*s}px`, height: `${30*s}px` }}><div style={{ height: "3px", background: top.secondary }} /><div style={{ height: "3px", background: top.secondary }} /></div>}
        {top.pattern === "stars" && <><div className="absolute opacity-40" style={{ top: `${15*s}px`, left: `${12*s}px`, fontSize: `${10*s}px` }}>✦</div><div className="absolute opacity-30" style={{ top: `${30*s}px`, right: `${15*s}px`, fontSize: `${8*s}px` }}>✧</div></>}
        {/* Belly peek */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full opacity-20" style={{ bottom: `${5*s}px`, width: `${30*s}px`, height: `${20*s}px`, background: animal.bellyColor }} />
      </div>

      {/* Arms */}
      <div className="absolute shadow-sm" style={{ top: `${95*s}px`, left: `${52*s}px`, width: `${18*s}px`, height: `${50*s}px`, borderRadius: "40%", background: `linear-gradient(180deg, ${top.color}, ${animal.bodyColor})`, border: `1.5px solid ${animal.bodyColor}44`, transform: "rotate(15deg)" }}>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" style={{ width: `${14*s}px`, height: `${12*s}px`, background: animal.pawColor }} />
      </div>
      <div className="absolute shadow-sm" style={{ top: `${95*s}px`, right: `${52*s}px`, width: `${18*s}px`, height: `${50*s}px`, borderRadius: "40%", background: `linear-gradient(180deg, ${top.color}, ${animal.bodyColor})`, border: `1.5px solid ${animal.bodyColor}44`, transform: "rotate(-15deg)" }}>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" style={{ width: `${14*s}px`, height: `${12*s}px`, background: animal.pawColor }} />
      </div>

      {/* Head */}
      <div
        className="absolute left-1/2 -translate-x-1/2 shadow-xl"
        style={{
          top: `${16*s}px`,
          width: `${80*s}px`,
          height: `${76*s}px`,
          borderRadius: "50% 50% 45% 45%",
          background: `radial-gradient(ellipse at 40% 30%, ${lighten(animal.bodyColor, 20)}, ${animal.bodyColor})`,
          border: `2px solid ${animal.bodyColor}88`,
          boxShadow: `inset 0 ${3*s}px ${10*s}px rgba(255,255,255,0.1), 0 ${4*s}px ${15*s}px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Face lighter area */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-[50%] opacity-60" style={{ top: `${18*s}px`, width: `${50*s}px`, height: `${48*s}px`, background: `radial-gradient(ellipse, ${animal.bellyColor}, transparent)` }} />

        {/* Cheeks (blush) */}
        <div className="absolute rounded-full opacity-50" style={{ bottom: `${18*s}px`, left: `${10*s}px`, width: `${16*s}px`, height: `${10*s}px`, background: animal.cheekColor }} />
        <div className="absolute rounded-full opacity-50" style={{ bottom: `${18*s}px`, right: `${10*s}px`, width: `${16*s}px`, height: `${10*s}px`, background: animal.cheekColor }} />

        {/* Eyes */}
        <div className="absolute flex justify-center" style={{ top: `${26*s}px`, left: 0, right: 0, gap: `${16*s}px` }}>
          <AnimeEye3D style={eyes} scale={s} />
          <AnimeEye3D style={eyes} scale={s} isRight />
        </div>

        {/* Nose */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ top: `${46*s}px`, width: `${8*s}px`, height: `${5*s}px`, background: animal.noseColor }} />

        {/* Mouth */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `${52*s}px` }}>
          <AnimeMouth3D type={mouth.type} scale={s} />
        </div>
      </div>

      {/* Ears */}
      <AnimalEars animal={animal} scale={s} />

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

// ─── Animal Ears ──────────────────────────────────────────────

function AnimalEars({ animal, scale: s }: { animal: typeof ANIMALS[0]; scale: number }) {
  // Different ear shapes per animal type
  const earSize = animal.name === "Coelhinho" ? { w: 16, h: 40 } : animal.name === "Coruja" ? { w: 18, h: 20 } : { w: 20, h: 22 };

  const earRadius = animal.name === "Coelhinho" ? "45%" : animal.name === "Raposa" || animal.name === "Gatinho" ? "20% 20% 50% 50%" : "50%";

  return (
    <>
      <div
        className="absolute shadow-md"
        style={{
          top: `${(animal.name === "Coelhinho" ? -4 : 10) * s}px`,
          left: `${68*s}px`,
          width: `${earSize.w*s}px`,
          height: `${earSize.h*s}px`,
          borderRadius: earRadius,
          background: `linear-gradient(180deg, ${animal.earColor}, ${animal.bodyColor})`,
          border: `1.5px solid ${animal.earColor}88`,
          transform: "rotate(-15deg)",
          boxShadow: `inset 0 0 ${4*s}px rgba(255,255,255,0.1)`,
        }}
      >
        <div className="absolute inset-[25%] rounded-[inherit] opacity-40" style={{ background: animal.cheekColor }} />
      </div>
      <div
        className="absolute shadow-md"
        style={{
          top: `${(animal.name === "Coelhinho" ? -4 : 10) * s}px`,
          right: `${68*s}px`,
          width: `${earSize.w*s}px`,
          height: `${earSize.h*s}px`,
          borderRadius: earRadius,
          background: `linear-gradient(180deg, ${animal.earColor}, ${animal.bodyColor})`,
          border: `1.5px solid ${animal.earColor}88`,
          transform: "rotate(15deg)",
          boxShadow: `inset 0 0 ${4*s}px rgba(255,255,255,0.1)`,
        }}
      >
        <div className="absolute inset-[25%] rounded-[inherit] opacity-40" style={{ background: animal.cheekColor }} />
      </div>
    </>
  );
}

// ─── Tail ─────────────────────────────────────────────────────

function Tail({ type, color, scale: s }: { type: string; color: string; scale: number }) {
  if (type === "none") return null;
  if (type === "round" || type === "puff") {
    return <div className="absolute rounded-full" style={{ bottom: `${55*s}px`, right: `${50*s}px`, width: `${16*s}px`, height: `${16*s}px`, background: color, border: `1px solid ${color}88` }} />;
  }
  if (type === "long" || type === "fluffy") {
    return <div className="absolute rounded-full" style={{ bottom: `${50*s}px`, right: `${44*s}px`, width: `${14*s}px`, height: `${40*s}px`, background: `linear-gradient(180deg, ${color}, ${lighten(color, 10)})`, border: `1px solid ${color}88`, transform: "rotate(-20deg)", borderRadius: "40%" }} />;
  }
  return <div className="absolute rounded-full" style={{ bottom: `${60*s}px`, right: `${52*s}px`, width: `${10*s}px`, height: `${10*s}px`, background: color }} />;
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

export { ANIMALS };
