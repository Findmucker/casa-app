"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AnimeAnimalCharacter, type AvatarConfig } from "./AvatarBuilder";
import { LOOT_POOL, type EquippedItems } from "@/lib/gamification";

// Cache avatars across components in the same session
const avatarCache = new Map<string, { avatar: AvatarConfig | null; equipped: EquippedItems }>();

interface MiniAvatarProps {
  name: string;
  size?: number; // px: 20, 28, 40 (default 24)
  showEquipBadge?: boolean;
  /** Pass pre-loaded avatar to skip Firestore fetch */
  avatarConfig?: AvatarConfig | null;
  /** Pass pre-loaded equipped items to skip Firestore fetch */
  equippedItems?: EquippedItems;
}

export default function MiniAvatar({ name, size = 24, showEquipBadge = true, avatarConfig, equippedItems }: MiniAvatarProps) {
  // Gamification docs use display name (capitalized), but assignees may be lowercase keys
  const docName = name.charAt(0).toUpperCase() + name.slice(1);
  const preloaded = avatarConfig !== undefined;

  const [avatar, setAvatar] = useState<AvatarConfig | null | undefined>(
    preloaded ? (avatarConfig ?? null) : avatarCache.has(docName) ? avatarCache.get(docName)!.avatar : undefined
  );
  const [equipped, setEquipped] = useState<EquippedItems>(
    preloaded ? (equippedItems || {}) : avatarCache.has(docName) ? avatarCache.get(docName)!.equipped : {}
  );

  useEffect(() => {
    if (preloaded) return; // Skip fetch when data is passed in
    if (!docName) { setAvatar(null); return; }

    if (avatarCache.has(docName)) {
      const cached = avatarCache.get(docName)!;
      setAvatar(cached.avatar);
      setEquipped(cached.equipped);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "gamification", docName));
        if (!snap.exists()) {
          // Also try lowercase version
          const snapLower = await getDoc(doc(db, "gamification", name.toLowerCase()));
          if (snapLower.exists()) {
            const config = snapLower.data()?.avatar || null;
            const eq = snapLower.data()?.equipped || {};
            avatarCache.set(docName, { avatar: config, equipped: eq });
            if (!cancelled) { setAvatar(config); setEquipped(eq); }
            return;
          }
          avatarCache.set(docName, { avatar: null, equipped: {} });
          if (!cancelled) { setAvatar(null); setEquipped({}); }
          return;
        }
        const config = snap.data()?.avatar || null;
        const eq = snap.data()?.equipped || {};
        avatarCache.set(docName, { avatar: config, equipped: eq });
        if (!cancelled) { setAvatar(config); setEquipped(eq); }
      } catch {
        avatarCache.set(docName, { avatar: null, equipped: {} });
        if (!cancelled) { setAvatar(null); setEquipped({}); }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [docName, name, preloaded]);

  // Get helmet emoji for badge
  const helmetItem = equipped.helmet ? LOOT_POOL.find((i) => i.id === equipped.helmet) : null;

  // Generate a deterministic default avatar config from name (so each person looks unique)
  const defaultAvatar: AvatarConfig = {
    animal: name.length % 11,
    eyes: (name.charCodeAt(0) || 0) % 7,
    mouth: (name.charCodeAt(1) || 0) % 7,
    top: (name.charCodeAt(0) || 0) % 7,
    bottom: (name.charCodeAt(1) || 0) % 7,
    accessory: 0,
    background: 0,
    effect: 0,
  };

  // Loading state
  if (avatar === undefined) {
    return (
      <div
        className="rounded-sm bg-pink-100 animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  // Use actual avatar or deterministic default
  const displayAvatar = avatar || defaultAvatar;

  // Render pixel art avatar (only if size is large enough for pixels to be visible)
  if (size < 20) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="rounded-sm overflow-hidden border-2 border-rose-300/60 bg-white flex items-center justify-center"
          style={{ width: size, height: size, imageRendering: "pixelated" }}
        >
          <AnimeAnimalCharacter config={displayAvatar} size={size} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="rounded-sm overflow-hidden border-2 border-rose-300/60 bg-white flex items-center justify-center"
        style={{ width: size, height: size, imageRendering: "pixelated" }}
      >
        <AnimeAnimalCharacter config={displayAvatar} size={size - 4} />
      </div>
      {showEquipBadge && helmetItem && size >= 28 && (
        <span className="absolute -top-0.5 -right-0.5 leading-none" style={{ fontSize: size * 0.35 }}>{helmetItem.emoji}</span>
      )}
    </div>
  );
}
