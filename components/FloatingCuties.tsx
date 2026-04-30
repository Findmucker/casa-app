"use client";

import { useEffect, useState } from "react";

const CUTE_EMOJIS = ["🦋", "🌸", "💕", "✨", "🪻", "🌷", "🐝", "🌈", "💗", "🩷", "🫧", "🌺"];

interface FloatingEmoji {
  id: number;
  emoji: string;
  left: number;
  duration: number;
  delay: number;
  size: number;
}

export default function FloatingCuties() {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    let counter = 0;

    const spawnBatch = () => {
      const batch: FloatingEmoji[] = Array.from({ length: 3 }, () => ({
        id: counter++,
        emoji: CUTE_EMOJIS[Math.floor(Math.random() * CUTE_EMOJIS.length)],
        left: Math.random() * 100,
        duration: 6 + Math.random() * 6,
        delay: Math.random() * 2,
        size: 14 + Math.random() * 12,
      }));

      setEmojis((prev) => [...prev, ...batch]);

      // Clean up old ones after animation
      setTimeout(() => {
        setEmojis((prev) => prev.filter((e) => !batch.find((b) => b.id === e.id)));
      }, 14000);
    };

    // First batch after 5s
    const initialTimeout = setTimeout(spawnBatch, 5000);

    // Then every 20-40s
    const interval = setInterval(() => {
      spawnBatch();
    }, 20000 + Math.random() * 20000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (emojis.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {emojis.map((e) => (
        <span
          key={e.id}
          className="absolute animate-drift"
          style={{
            left: `${e.left}%`,
            fontSize: `${e.size}px`,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
          }}
        >
          {e.emoji}
        </span>
      ))}
    </div>
  );
}
