"use client";

import { useState } from "react";
import { createInvite } from "@/lib/auth";

interface InvitePanelProps {
  houseId: string;
  userId: string;
  onClose: () => void;
}

export default function InvitePanel({ houseId, userId, onClose }: InvitePanelProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInvite = async () => {
    setLoading(true);
    const newCode = await createInvite(houseId, userId);
    setCode(newCode);
    setLoading(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/convite/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-50/98 via-rose-50/98 to-purple-50/98 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in-up p-6">
      <div className="text-5xl mb-4">🔗</div>
      <h2 className="text-lg font-bold text-rose-500 mb-2">Convidar membro</h2>
      <p className="text-sm text-pink-400 text-center mb-6">Gera um código para alguém se juntar à tua casa</p>

      {!code ? (
        <button
          onClick={generateInvite}
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-8 py-3 text-white font-semibold active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {loading ? "A gerar..." : "Gerar convite"}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl px-8 py-4 border border-pink-200/60 shadow-sm">
            <p className="text-2xl font-mono font-bold tracking-[0.3em] text-rose-600">{code}</p>
          </div>
          <p className="text-[11px] text-pink-400">Válido por 7 dias</p>
          <button
            onClick={copyLink}
            className="rounded-xl bg-pink-100 px-5 py-2.5 text-sm font-medium text-rose-600 active:scale-95 transition-all"
          >
            {copied ? "✓ Copiado!" : "📋 Copiar link"}
          </button>
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-8 text-sm text-pink-400 hover:text-pink-600 transition-colors"
      >
        Fechar
      </button>
    </div>
  );
}
