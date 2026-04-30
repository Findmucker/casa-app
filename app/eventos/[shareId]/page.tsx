"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import EventList from "@/components/EventList";
import { validateShareId } from "@/lib/share";

export default function PublicEventsPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [valid, setValid] = useState<boolean | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    validateShareId(shareId).then(setValid);
    const saved = localStorage.getItem("casa-guest-name");
    if (saved) setGuestName(saved);
  }, [shareId]);

  const handleSetName = () => {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    localStorage.setItem("casa-guest-name", name);
    setGuestName(name);
  };

  if (valid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="text-3xl animate-pulse">🎉</div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <p className="text-rose-400 font-medium">Link inválido</p>
          <p className="text-pink-300 text-sm">Este link de partilha não existe.</p>
        </div>
      </div>
    );
  }

  // Ask for name if not set
  if (!guestName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="flex flex-col items-center gap-6 p-8">
          <div className="text-5xl">🎉</div>
          <h2 className="text-lg font-bold text-purple-500">Bem-vindo!</h2>
          <p className="text-sm text-pink-400 text-center">Como te chamas?</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSetName()}
            placeholder="O teu nome..."
            className="w-64 rounded-2xl border border-purple-200/60 bg-white/80 px-4 py-3 text-base text-rose-800 placeholder-purple-300 focus:outline-none focus:border-purple-300 text-center transition-all"
            autoFocus
          />
          <button
            onClick={handleSetName}
            disabled={!nameInput.trim()}
            className="rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 px-8 py-3 text-white font-semibold hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all disabled:opacity-40"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-purple-100/50 px-4 py-3.5 flex items-center justify-between">
        <h1 className="text-base font-bold text-purple-500 tracking-wide">
          🎉 Eventos
        </h1>
        <span className="text-xs text-purple-400 bg-purple-50 px-2.5 py-1 rounded-full">
          👋 {guestName}
        </span>
      </header>

      {/* Events */}
      <main className="flex-1">
        <EventList isPublic />
      </main>
    </div>
  );
}
