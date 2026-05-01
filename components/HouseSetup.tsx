"use client";

import { useState } from "react";

interface HouseSetupProps {
  onCreateHouse: (name: string) => Promise<void>;
  onJoinHouse: (code: string) => Promise<boolean>;
  userName: string;
}

export default function HouseSetup({ onCreateHouse, onJoinHouse, userName }: HouseSetupProps) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [houseName, setHouseName] = useState("A Nossa Casinha");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!houseName.trim()) return;
    setLoading(true);
    try {
      await onCreateHouse(houseName.trim());
    } catch (e) {
      setError("Erro ao criar casa");
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError("");
    const ok = await onJoinHouse(inviteCode.trim().toUpperCase());
    if (!ok) setError("Código inválido ou expirado");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-fade-in-up">
        <div className="animate-float">
          <div className="text-6xl">🏡</div>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-rose-400">Olá, {userName}!</h1>
          <p className="text-rose-300 text-sm mt-1">Vamos configurar a tua casa</p>
        </div>

        {mode === "choose" && (
          <div className="w-full space-y-3">
            <button
              onClick={() => setMode("create")}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/80 border border-pink-100/40 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
            >
              <span className="text-2xl">✨</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-rose-700">Criar nova casa</p>
                <p className="text-[11px] text-pink-400">Começar do zero</p>
              </div>
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/80 border border-pink-100/40 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
            >
              <span className="text-2xl">🔗</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-rose-700">Tenho um convite</p>
                <p className="text-[11px] text-pink-400">Juntar-me a uma casa existente</p>
              </div>
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="w-full space-y-4">
            <input
              type="text"
              value={houseName}
              onChange={(e) => setHouseName(e.target.value)}
              placeholder="Nome da casa..."
              className="w-full rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={loading || !houseName.trim()}
              className="w-full rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 py-3 text-white font-semibold active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {loading ? "A criar..." : "Criar casa 🏡"}
            </button>
            <button onClick={() => setMode("choose")} className="w-full text-sm text-pink-400 hover:text-pink-600">← Voltar</button>
          </div>
        )}

        {mode === "join" && (
          <div className="w-full space-y-4">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Código do convite..."
              maxLength={6}
              className="w-full rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-center text-lg font-mono tracking-widest text-rose-800 placeholder-pink-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50 uppercase"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading || inviteCode.length < 4}
              className="w-full rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 py-3 text-white font-semibold active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {loading ? "A verificar..." : "Juntar-me 🔗"}
            </button>
            <button onClick={() => setMode("choose")} className="w-full text-sm text-pink-400 hover:text-pink-600">← Voltar</button>
          </div>
        )}
      </div>
    </div>
  );
}
