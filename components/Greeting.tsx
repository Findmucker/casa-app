"use client";

import { useEffect, useState } from "react";

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return { text: "Bom dia", emoji: "☀️" };
  if (hour >= 12 && hour < 19) return { text: "Boa tarde", emoji: "🌤️" };
  return { text: "Boa noite", emoji: "🌙" };
}

const OWNER_DISPLAY: Record<string, string> = {
  eduardo: "Eduardo",
  moniquinha: "Moniquinha",
};

export default function Greeting({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const greeting = getGreeting();
  const owner = typeof window !== "undefined" ? localStorage.getItem("casa-owner") : null;
  const displayName = owner ? OWNER_DISPLAY[owner] || owner : "amor";

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("show"), 50);
    const t2 = setTimeout(() => setPhase("exit"), 1200);
    const t3 = setTimeout(() => onDone(), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 transition-opacity duration-400 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Floating hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="absolute text-pink-200/60 animate-float-heart"
            style={{
              left: `${10 + i * 12}%`,
              fontSize: `${14 + (i % 3) * 8}px`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${2 + (i % 3) * 0.5}s`,
            }}
          >
            💕
          </span>
        ))}
      </div>

      {/* Main greeting */}
      <div
        className={`text-center transition-all duration-500 ${
          phase === "enter"
            ? "opacity-0 scale-90 translate-y-4"
            : phase === "show"
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-4"
        }`}
      >
        <div className="text-5xl mb-4 animate-bounce-gentle">{greeting.emoji}</div>
        <h1 className="text-3xl font-bold text-rose-400 mb-1">
          {greeting.text},
        </h1>
        <h2 className="text-2xl font-semibold text-pink-400">
          {displayName} 💕
        </h2>
        <div className="flex justify-center gap-1 mt-3">
          {["❤️", "🩷", "💗", "🩷", "❤️"].map((h, i) => (
            <span
              key={i}
              className="animate-pulse-heart text-lg"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
