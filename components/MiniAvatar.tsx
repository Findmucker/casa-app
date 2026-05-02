"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AnimeAnimalCharacter, type AvatarConfig } from "./AvatarBuilder";

// Cache avatars across components in the same session
const avatarCache = new Map<string, AvatarConfig | null>();

interface MiniAvatarProps {
  name: string;
  size?: number; // px: 20, 28, 40 (default 24)
}

export default function MiniAvatar({ name, size = 24 }: MiniAvatarProps) {
  const [avatar, setAvatar] = useState<AvatarConfig | null | undefined>(
    avatarCache.has(name) ? avatarCache.get(name) : undefined
  );

  useEffect(() => {
    if (avatarCache.has(name)) {
      setAvatar(avatarCache.get(name) ?? null); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "gamification", name));
        const config = snap.exists() ? snap.data()?.avatar || null : null;
        avatarCache.set(name, config);
        if (!cancelled) setAvatar(config);
      } catch {
        avatarCache.set(name, null);
        if (!cancelled) setAvatar(null);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [name]);

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
      <div
        className="rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-white font-bold" style={{ fontSize: size * 0.45 }}>
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  // Render pixel art avatar
  return (
    <div
      className="rounded-full overflow-hidden border border-rose-200/50 bg-white flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <AnimeAnimalCharacter config={avatar} size={size - 4} />
    </div>
  );
}
