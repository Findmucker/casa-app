"use client";

import { useState } from "react";

interface BirthDatePromptProps {
  userName: string;
  onSave: (birthDate: string) => Promise<void>;
}

export default function BirthDatePrompt({ userName, onSave }: BirthDatePromptProps) {
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!birthDate) { setError("Por favor seleciona a tua data de nascimento"); return; }
    setLoading(true);
    try {
      await onSave(birthDate);
    } catch {
      setError("Erro ao guardar. Tenta de novo.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-fade-in-up">
        <div className="text-6xl animate-float">🎂</div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-rose-400">Olá, {userName}!</h1>
          <p className="text-rose-300 text-sm mt-2">
            Precisamos da tua data de nascimento para calcular aniversários automaticamente.
          </p>
        </div>

        <input
          type="date"
          value={birthDate}
          onChange={(e) => { setBirthDate(e.target.value); setError(""); }}
          max={new Date().toISOString().split("T")[0]}
          className="w-full rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-3 text-sm text-rose-800 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100/50"
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          onClick={handleSave}
          disabled={loading || !birthDate}
          className="w-full rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 py-3 text-white font-semibold hover:from-pink-500 hover:to-rose-500 active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm shadow-pink-200/50"
        >
          {loading ? "..." : "Guardar 🎉"}
        </button>
      </div>
    </div>
  );
}
