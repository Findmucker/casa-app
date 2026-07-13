"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import EventList from "@/components/EventList";
import { getEventShare, type EventShare } from "@/lib/share";
import { HouseIdContext } from "@/lib/hooks";

export default function PublicEventsPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [share, setShare] = useState<EventShare | null | undefined>(undefined);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    getEventShare(shareId).then(setShare);
    const saved = localStorage.getItem("casa-guest-name");
    if (saved) setGuestName(saved);
  }, [shareId]);

  const handleSetName = () => {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    localStorage.setItem("casa-guest-name", name);
    setGuestName(name);
  };

  if (share === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="text-3xl animate-pulse">🎉</div>
      </div>
    );
  }

  if (!share) {
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
        <div className="flex flex-col items-center gap-5 p-8 max-w-sm">
          <div className="text-5xl animate-bounce-gentle">🏡</div>
          <h2 className="text-xl font-bold text-purple-500 text-center">
            Bem-vindo aos nossos eventos!
          </h2>
          <p className="text-sm text-pink-400 text-center leading-relaxed">
            Estamos a organizar algo especial 💕<br />
            Diz-nos o teu nome para participares!
          </p>
          <div className="w-full space-y-3 mt-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetName()}
              placeholder="O teu nome..."
              className="w-full rounded-2xl border border-purple-200/60 bg-white/80 px-4 py-3 text-base text-rose-800 placeholder-purple-300 focus:outline-none focus:border-purple-300 text-center transition-all"
              autoFocus
            />
            <button
              onClick={handleSetName}
              disabled={!nameInput.trim()}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 px-8 py-3 text-white font-semibold hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all disabled:opacity-40"
            >
              Entrar 🎉
            </button>
          </div>
          <p className="text-[11px] text-pink-300 text-center mt-2">
            Podes ver eventos, adicionar compras e tarefas, e juntar-te à organização!
          </p>
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
        <HouseIdContext.Provider value={share.houseId}>
          <EventList isPublic guestName={guestName} />
        </HouseIdContext.Provider>
      </main>
    </div>
  );
}
