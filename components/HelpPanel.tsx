"use client";

import { useState, useMemo, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useHouseContext } from "@/lib/context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface HelpPanelProps {
  onClose: () => void;
}

interface HelpSection {
  id: string;
  emoji: string;
  titleKey: string;
  tips: string[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: "shopping",
    emoji: "🛒",
    titleKey: "help.shopping.title",
    tips: ["help.shopping.tip1", "help.shopping.tip2", "help.shopping.tip3", "help.shopping.tip4", "help.shopping.tip5"],
  },
  {
    id: "coisinhas",
    emoji: "🧹",
    titleKey: "help.coisinhas.title",
    tips: ["help.coisinhas.tip1", "help.coisinhas.tip2", "help.coisinhas.tip3", "help.coisinhas.tip4"],
  },
  {
    id: "projects",
    emoji: "🔧",
    titleKey: "help.projects.title",
    tips: ["help.projects.tip1", "help.projects.tip2", "help.projects.tip3"],
  },
  {
    id: "habits",
    emoji: "🧘",
    titleKey: "help.habits.title",
    tips: ["help.habits.tip1", "help.habits.tip2", "help.habits.tip3", "help.habits.tip4", "help.habits.tip5"],
  },
  {
    id: "finances",
    emoji: "💰",
    titleKey: "help.finances.title",
    tips: ["help.finances.tip1", "help.finances.tip2", "help.finances.tip3", "help.finances.tip4"],
  },
  {
    id: "calendar",
    emoji: "📅",
    titleKey: "help.calendar.title",
    tips: ["help.calendar.tip1", "help.calendar.tip2", "help.calendar.tip3", "help.calendar.tip4"],
  },
  {
    id: "events",
    emoji: "🎉",
    titleKey: "help.events.title",
    tips: ["help.events.tip1", "help.events.tip2", "help.events.tip3"],
  },
  {
    id: "notifications",
    emoji: "🔔",
    titleKey: "help.notifications.title",
    tips: ["help.notifications.tip1", "help.notifications.tip2", "help.notifications.tip3", "help.notifications.tip4"],
  },
  {
    id: "friends",
    emoji: "🏠",
    titleKey: "help.friends.title",
    tips: ["help.friends.tip1", "help.friends.tip2", "help.friends.tip3"],
  },
  {
    id: "gamification",
    emoji: "⚔️",
    titleKey: "help.gamification.title",
    tips: ["help.gamification.tip1", "help.gamification.tip2", "help.gamification.tip3", "help.gamification.tip4"],
  },
];

export default function HelpPanel({ onClose }: HelpPanelProps) {
  const { t } = useT();
  const { userId } = useHouseContext();
  const [search, setSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [notifStatus, setNotifStatus] = useState<{ permission: string; hasToken: boolean | null }>({ permission: "unknown", hasToken: null });

  // Check notification status
  useEffect(() => {
    const perm = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";
    setNotifStatus((s) => ({ ...s, permission: perm }));

    // Check if FCM token exists in Firestore
    if (userId) {
      getDoc(doc(db, "fcm_tokens", userId)).then((snap) => {
        setNotifStatus((s) => ({ ...s, hasToken: snap.exists() }));
      }).catch(() => {
        setNotifStatus((s) => ({ ...s, hasToken: false }));
      });
    }
  }, [userId]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return HELP_SECTIONS;
    const q = search.toLowerCase();
    return HELP_SECTIONS.filter((s) => {
      const title = t(s.titleKey as Parameters<typeof t>[0]).toLowerCase();
      const tips = s.tips.map((tip) => t(tip as Parameters<typeof t>[0]).toLowerCase());
      return title.includes(q) || tips.some((tip) => tip.includes(q));
    });
  }, [search, t]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in-up bg-gradient-to-br from-pink-50/98 via-rose-50/98 to-purple-50/98 backdrop-blur-md">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white/60 backdrop-blur-sm border-b border-pink-100/40">
        <h2 className="text-lg font-bold text-rose-500">{t("help.title")}</h2>
        <button
          onClick={onClose}
          className="text-sm text-pink-400 hover:text-pink-600 transition-all active:scale-95"
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pt-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("help.search")}
          className="w-full px-4 py-2.5 rounded-2xl bg-white/70 border border-pink-100/30 text-sm text-rose-800 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
        />
      </div>

      {/* Sections */}
      <div className="px-5 py-4 space-y-3">
        {filteredSections.length === 0 && (
          <p className="text-center text-pink-300 text-sm py-8">{t("help.noResults")}</p>
        )}

        {filteredSections.map((section) => {
          const isExpanded = expandedSection === section.id;
          return (
            <div
              key={section.id}
              className="bg-white/70 rounded-2xl border border-pink-100/30 overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full flex items-center gap-3 px-4 py-3 active:scale-[0.98] transition-all"
              >
                <span className="text-xl">{section.emoji}</span>
                <span className="text-sm font-semibold text-rose-700 flex-1 text-left">
                  {t(section.titleKey as Parameters<typeof t>[0])}
                </span>
                <span className={`text-pink-400 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-2 animate-fade-in-up">
                  {section.tips.map((tipKey, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-pink-300 text-xs mt-0.5">•</span>
                      <p className="text-xs text-rose-600 leading-relaxed">
                        {t(tipKey as Parameters<typeof t>[0])}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notification status */}
      <div className="px-5 pb-6">
        <div className="bg-white/70 rounded-2xl border border-pink-100/30 p-4 space-y-2">
          <p className="text-xs font-semibold text-rose-700">🔔 Notification Status</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${notifStatus.permission === "granted" ? "bg-green-400" : notifStatus.permission === "denied" ? "bg-red-400" : "bg-amber-400"}`} />
            <span className="text-xs text-rose-600">
              Permission: <strong>{notifStatus.permission}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${notifStatus.hasToken === true ? "bg-green-400" : notifStatus.hasToken === false ? "bg-red-400" : "bg-gray-300"}`} />
            <span className="text-xs text-rose-600">
              FCM Token: <strong>{notifStatus.hasToken === true ? "registered" : notifStatus.hasToken === false ? "missing" : "checking..."}</strong>
            </span>
          </div>
          {notifStatus.permission !== "granted" && (
            <p className="text-[10px] text-pink-400 mt-1">
              Go to Habits → tap 🔔 to enable push notifications
            </p>
          )}
          {notifStatus.permission === "granted" && notifStatus.hasToken === false && (
            <p className="text-[10px] text-pink-400 mt-1">
              Token missing — try tapping 🔔 in Habits again to re-register
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
