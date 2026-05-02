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
}

export default function MiniAvatar({ name, size = 24, showEquipBadge = true }: MiniAvatarProps) {
  const [avatar, setAvatar] = useState<AvatarConfig | null | undefined>(
    avatarCache.has(name) ? avatarCache.get(name)!.avatar : undefined
  );
  const [equipped, setEquipped] = useState<EquippedItems>(
    avatarCache.has(name) ? avatarCache.get(name)!.equipped : {}
  );

  useEffect(() => {
    if (avatarCache.has(name)) {
      const cached = avatarCache.get(name)!;
      setAvatar(cached.avatar);
      setEquipped(cached.equipped);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "gamification", name));
        const config = snap.exists() ? snap.data()?.avatar || null : null;
        const eq = snap.exists() ? snap.data()?.equipped || {} : {};
        avatarCache.set(name, { avatar: config, equipped: eq });
        if (!cancelled) { setAvatar(config); setEquipped(eq); }
      } catch {
        avatarCache.set(name, { avatar: null, equipped: {} });
        if (!cancelled) { setAvatar(null); setEquipped({}); }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [name]);

  // Get helmet emoji for badge
  const helmetItem = equipped.helmet ? LOOT_POOL.find((i) => i.id === equipped.helmet) : null;

  // Loading state
  if (avatar === undefined) {
    return (
      <div
        className="rounded-full bg-pink-100 animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  // No avatar — fallback to initial
  if (!avatar) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-white font-bold" style={{ fontSize: size * 0.45 }}>
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        {showEquipBadge && helmetItem && size >= 28 && (
          <span className="absolute -top-0.5 -right-0.5 leading-none" style={{ fontSize: size * 0.35 }}>{helmetItem.emoji}</span>
        )}
      </div>
    );
  }

  // Render pixel art avatar
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="rounded-full overflow-hidden border border-rose-200/50 bg-white flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <AnimeAnimalCharacter config={avatar} size={size - 4} />
      </div>
      {showEquipBadge && helmetItem && size >= 28 && (
        <span className="absolute -top-0.5 -right-0.5 leading-none" style={{ fontSize: size * 0.35 }}>{helmetItem.emoji}</span>
      )}
    </div>
  );
}
