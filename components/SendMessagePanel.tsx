"use client";

import { useState } from "react";
import { useHouseContext } from "@/lib/context";
import { useT } from "@/lib/i18n";

interface SendMessagePanelProps {
  onClose: () => void;
}

const QUICK_MESSAGES = [
  "❤️ Amo-te!",
  "🏠 Estou a caminho de casa",
  "🛒 Vou ao supermercado, precisas de algo?",
  "🍽️ O jantar está pronto!",
  "💊 Não te esqueças da pílula!",
  "🐱 O gato precisa de comer",
  "☕ Queres um café?",
  "🧹 Já limpei a cozinha!",
];

export default function SendMessagePanel({ onClose }: SendMessagePanelProps) {
  const { userName, members } = useHouseContext();
  const { t } = useT();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Get the other member(s) — everyone except current user
  const otherMembers = members.filter(
    (m) => m.name.toLowerCase() !== userName.toLowerCase()
  );

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setSending(true);
    setStatus(null);

    // Send to all other members
    let sentCount = 0;
    for (const member of otherMembers) {
      try {
        const res = await fetch("/api/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: member.name.toLowerCase(),
            title: `💌 Mensagem de ${userName}`,
            body: text,
            tag: "message",
          }),
        });
        if (res.ok) sentCount++;
      } catch {
        // continue to next member
      }
    }

    if (sentCount > 0) {
      setStatus(t("messages.sent"));
      setMessage("");
    } else {
      setStatus(t("messages.failed"));
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-50/98 via-rose-50/98 to-purple-50/98 backdrop-blur-md z-50 flex flex-col animate-fade-in-up">
      <div className="p-4 border-b border-pink-100/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-rose-500">{t("messages.title")}</h2>
          <button
            onClick={onClose}
            aria-label={t("messages.close")}
            className="text-sm text-pink-400 hover:text-pink-600 transition-colors"
          >
            {t("messages.close")}
          </button>
        </div>
        {otherMembers.length > 0 && (
          <p className="text-xs text-pink-400 mt-1">
            {t("messages.to")}: {otherMembers.map((m) => m.name).join(", ")}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick messages */}
        <div>
          <p className="text-xs font-semibold text-pink-400 mb-2">{t("messages.quickMessages")}</p>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_MESSAGES.map((msg) => (
              <button
                key={msg}
                onClick={() => sendMessage(msg)}
                disabled={sending}
                className="text-left px-4 py-2.5 rounded-2xl bg-white/70 border border-pink-100/30 shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <span className="text-sm text-rose-700">{msg}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom message */}
        <div>
          <p className="text-xs font-semibold text-pink-400 mb-2">{t("messages.custom")}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && message.trim()) sendMessage(message);
              }}
              placeholder={t("messages.placeholder")}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white/70 border border-pink-100/30 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200"
              disabled={sending}
            />
            <button
              onClick={() => sendMessage(message)}
              disabled={sending || !message.trim()}
              aria-label="Enviar mensagem"
              className="px-4 py-2.5 rounded-2xl bg-rose-400 text-white font-semibold text-sm shadow-md hover:bg-rose-500 active:scale-95 transition-all disabled:opacity-50"
            >
              {sending ? "..." : "📤"}
            </button>
          </div>
        </div>

        {otherMembers.length === 0 && (
          <p className="text-center text-pink-300 text-sm py-4">
            {t("messages.noMembers")}
          </p>
        )}

        {status && (
          <p className="text-sm text-center text-pink-500 animate-fade-in-up">{status}</p>
        )}
      </div>
    </div>
  );
}
