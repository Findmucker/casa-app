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
  // Gamification docs use display name (capitalized), but assignees may be lowercase keys
  const docName = name.charAt(0).toUpperCase() + name.slice(1);

  const [avatar, setAvatar] = useState<AvatarConfig | null | undefined>(
    avatarCache.has(docName) ? avatarCache.get(docName)!.avatar : undefined
  );
  const [equipped, setEquipped] = useState<EquippedItems>(
    avatarCache.has(docName) ? avatarCache.get(docName)!.equipped : {}
  );

  useEffect(() => {
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
  }, [docName, name]);

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

  // Render pixel art avatar (only if size is large enough for pixels to be visible)
  if (size < 20) {
    // Too small for pixel art — show colored initial with avatar's animal color hint
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center border border-rose-200/50"
          style={{ width: size, height: size }}
        >
          <span className="text-white font-bold" style={{ fontSize: size * 0.5 }}>
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

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
