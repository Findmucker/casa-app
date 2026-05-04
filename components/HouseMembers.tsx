"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useHouseContext } from "@/lib/context";
import { getLevel, getTitle } from "@/lib/gamification";
import { type AvatarConfig } from "./AvatarBuilder";
import MiniAvatar from "./MiniAvatar";
import { useT } from "@/lib/i18n";

interface HouseMembersProps {
  onClose: () => void;
  initialMessageTo?: string; // member name to auto-open message panel
}

interface MemberData {
  uid: string;
  name: string;
  role: string;
  avatar?: AvatarConfig;
  points: number;
  level: number;
  title: string;
  maxStreak: number;
}

const QUICK_MESSAGES = [
  "❤️ Amo-te!",
  "🏠 Estou a caminho de casa",
  "🛒 Vou ao supermercado, precisas de algo?",
  "🍽️ O jantar está pronto!",
  "☕ Queres um café?",
  "🧹 Já limpei a cozinha!",
  "💤 Vou dormir, boa noite!",
  "🎉 Tenho uma surpresa para ti!",
];

export default function HouseMembers({ onClose, initialMessageTo }: HouseMembersProps) {
  const { t } = useT();
  const { members, houseId, userId, userName } = useHouseContext();
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [messageTo, setMessageTo] = useState<MemberData | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [msgStatus, setMsgStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data: MemberData[] = await Promise.all(
        members.map(async (m) => {
          try {
            const ref = doc(db, "gamification", m.name);
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const d = snap.data();
              const points = d.points || 0;
              const { level } = getLevel(points);
              return {
                uid: m.uid,
                name: m.name,
                role: m.role,
                avatar: d.avatar || undefined,
                points,
                level,
                title: getTitle(level),
                maxStreak: d.maxStreak || 0,
              };
            }
          } catch { /* ignore */ }
          return {
            uid: m.uid,
            name: m.name,
            role: m.role,
            points: 0,
            level: 1,
            title: getTitle(1),
            maxStreak: 0,
          };
        })
      );
      setMemberData(data);
      setLoading(false);
    };
    load();
  }, [members]);

  // Auto-open message panel if initialMessageTo is set
  useEffect(() => {
    if (initialMessageTo && memberData.length > 0 && !messageTo) {
      const target = memberData.find((m) => m.name === initialMessageTo);
      if (target) setMessageTo(target);
    }
  }, [initialMessageTo, memberData]);

  const handleLeavehouse = async () => {
    try {
      const houseRef = doc(db, "houses", houseId);
      const memberObj = members.find((m) => m.uid === userId);
      if (memberObj) {
        await updateDoc(houseRef, { members: arrayRemove(memberObj) });
      }
      // Reload to go back to house setup
      window.location.reload();
    } catch (e) {
      console.error("Error leaving house:", e);
    }
  };

  const sendMessage = async (text: string, toMember: MemberData) => {
    if (!text.trim()) return;
    setSending(true);
    setMsgStatus(null);
    try {
      const res = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toMember.name.toLowerCase(),
          title: `💌 Mensagem de ${userName}`,
          body: text,
          tag: "message",
        }),
      });
      if (res.ok) {
        setMsgStatus("✅ Mensagem enviada!");
        setCustomMessage("");
        setTimeout(() => { setMsgStatus(null); setMessageTo(null); }, 2000);
      } else {
        setMsgStatus("❌ Não consegui enviar. Notificações ativas?");
      }
    } catch {
      setMsgStatus("❌ Erro ao enviar.");
    }
    setSending(false);
  };

  // Message sub-panel for a specific member
  if (messageTo) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 z-50 overflow-y-auto animate-fade-in-up">
        <div className="relative pt-6 pb-4 text-center border-b border-pink-100/50">
          <button
            onClick={() => { setMessageTo(null); setMsgStatus(null); }}
            className="absolute top-4 left-4 text-rose-400 hover:text-rose-600 text-sm transition-colors"
          >
            ← Voltar
          </button>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 text-sm transition-colors"
          >
            ✕
          </button>
          <h2 className="text-lg font-bold text-rose-600">💌 Mensagem</h2>
          <p className="text-xs text-purple-500 mt-0.5">Para: {messageTo.name}</p>
        </div>

        <div className="p-4 space-y-3">
          {/* Quick messages */}
          <p className="text-xs font-semibold text-pink-400 mb-2">{t("messages.quickMessages")}</p>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_MESSAGES.map((msg) => (
              <button
                key={msg}
                onClick={() => sendMessage(msg, messageTo)}
                disabled={sending}
                className="text-left px-4 py-2.5 rounded-2xl bg-white/70 border border-pink-100/30 shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <span className="text-sm text-rose-700">{msg}</span>
              </button>
            ))}
          </div>

          {/* Custom message */}
          <p className="text-xs font-semibold text-pink-400 mb-2 mt-4">{t("messages.custom")}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && customMessage.trim()) sendMessage(customMessage, messageTo); }}
              placeholder={t("messages.placeholder") as string}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white/70 border border-pink-100/30 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200"
              disabled={sending}
            />
            <button
              onClick={() => sendMessage(customMessage, messageTo)}
              disabled={sending || !customMessage.trim()}
              className="px-4 py-2.5 rounded-2xl bg-rose-400 text-white font-semibold text-sm shadow-md hover:bg-rose-500 active:scale-95 transition-all disabled:opacity-50"
            >
              {sending ? "..." : "📤"}
            </button>
          </div>

          {msgStatus && (
            <p className="text-sm text-center text-pink-500 animate-fade-in-up mt-3">{msgStatus}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 z-50 overflow-y-auto animate-fade-in-up">
      {/* Header */}
      <div className="relative pt-6 pb-4 text-center border-b border-pink-100/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 text-sm transition-colors"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold text-rose-600">👥 {t("members.management.title")}</h2>
        <p className="text-xs text-purple-500 mt-0.5">
          {members.length} {members.length === 1 ? t("members.management.member") : t("members.management.members")}
        </p>
      </div>

      {/* Members list */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-2xl">👥</div>
          </div>
        ) : (
          memberData.map((m, i) => (
            <div
              key={m.uid}
              className="p-3 rounded-xl bg-white/70 border border-pink-100/50 shadow-sm animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <MiniAvatar name={m.name} size={48} avatarConfig={m.avatar || null} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-rose-700 truncate">{m.name}</p>
                    {m.uid === userId && (
                      <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">{t("members.management.you")}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-purple-500">{m.title}</p>
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-bold text-purple-600">Nv. {m.level}</p>
                  <p className="text-[10px] text-gray-500">{m.points} pts</p>
                  {m.maxStreak > 0 && (
                    <p className="text-[10px] text-orange-500 font-medium">🔥 {m.maxStreak}</p>
                  )}
                </div>
              </div>

              {/* Actions (not yourself) */}
              {m.uid !== userId && (
                <div className="flex gap-2 mt-2 ml-15">
                  {/* Send message button */}
                  <button
                    onClick={() => setMessageTo(m)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-pink-50 text-pink-500 font-medium hover:bg-pink-100 active:scale-95 transition-all"
                  >
                    💌 {t("menu.message")}
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {/* Leave house — only for yourself */}
        {!loading && (
          <div className="mt-6 flex justify-center">
            {confirmRemove ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">Sair da casa?</span>
                <button
                  onClick={handleLeavehouse}
                  className="text-xs px-3 py-1.5 rounded-full bg-red-400 text-white font-medium active:scale-95"
                >
                  ✓ Confirmar
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-200 text-gray-600 font-medium active:scale-95"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRemove(true)}
                className="text-[11px] px-4 py-2 rounded-full bg-red-50 text-red-400 font-medium hover:bg-red-100 active:scale-95 transition-all border border-red-100/50"
              >
                🚪 Sair da casa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

