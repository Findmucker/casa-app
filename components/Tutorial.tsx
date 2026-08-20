"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import type { LocaleKeys } from "@/lib/locales/pt";

interface TutorialStep {
  emoji: string;
  titleKey: LocaleKeys;
  textKey: LocaleKeys;
  tipsKeys?: LocaleKeys[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    emoji: "🏡",
    titleKey: "tutorial.welcome.title",
    textKey: "tutorial.welcome.text",
    tipsKeys: ["tutorial.welcome.tip1", "tutorial.welcome.tip2", "tutorial.welcome.tip3"],
  },
  {
    emoji: "📱",
    titleKey: "tutorial.nav.title",
    textKey: "tutorial.nav.text",
    tipsKeys: ["tutorial.nav.tip1", "tutorial.nav.tip2", "tutorial.nav.tip3", "tutorial.nav.tip4"],
  },
  {
    emoji: "🛒",
    titleKey: "tutorial.shopping.title",
    textKey: "tutorial.shopping.text",
    tipsKeys: ["tutorial.shopping.tip1", "tutorial.shopping.tip2", "tutorial.shopping.tip3", "tutorial.shopping.tip4"],
  },
  {
    emoji: "🪴",
    titleKey: "tutorial.coisinhas.title",
    textKey: "tutorial.coisinhas.text",
    tipsKeys: ["tutorial.coisinhas.tip1", "tutorial.coisinhas.tip2", "tutorial.coisinhas.tip3", "tutorial.coisinhas.tip4"],
  },
  {
    emoji: "🏠",
    titleKey: "tutorial.projects.title",
    textKey: "tutorial.projects.text",
    tipsKeys: ["tutorial.projects.tip1", "tutorial.projects.tip2", "tutorial.projects.tip3", "tutorial.projects.tip4"],
  },
  {
    emoji: "🧘",
    titleKey: "tutorial.habits.title",
    textKey: "tutorial.habits.text",
    tipsKeys: ["tutorial.habits.tip1", "tutorial.habits.tip2", "tutorial.habits.tip3", "tutorial.habits.tip4"],
  },
  {
    emoji: "💰",
    titleKey: "tutorial.expenses.title",
    textKey: "tutorial.expenses.text",
    tipsKeys: ["tutorial.expenses.tip1", "tutorial.expenses.tip2", "tutorial.expenses.tip3", "tutorial.expenses.tip4", "tutorial.expenses.tip5"],
  },
  {
    emoji: "📅",
    titleKey: "tutorial.calendar.title",
    textKey: "tutorial.calendar.text",
    tipsKeys: ["tutorial.calendar.tip1", "tutorial.calendar.tip2", "tutorial.calendar.tip3", "tutorial.calendar.tip4"],
  },
  {
    emoji: "🎉",
    titleKey: "tutorial.events.title",
    textKey: "tutorial.events.text",
    tipsKeys: ["tutorial.events.tip1", "tutorial.events.tip2", "tutorial.events.tip3"],
  },
  {
    emoji: "🌤️",
    titleKey: "tutorial.weather.title",
    textKey: "tutorial.weather.text",
    tipsKeys: ["tutorial.weather.tip1", "tutorial.weather.tip2"],
  },
  {
    emoji: "👥",
    titleKey: "tutorial.members.title",
    textKey: "tutorial.members.text",
    tipsKeys: ["tutorial.members.tip1", "tutorial.members.tip2", "tutorial.members.tip3", "tutorial.members.tip4"],
  },
  {
    emoji: "💌",
    titleKey: "tutorial.messages.title",
    textKey: "tutorial.messages.text",
    tipsKeys: ["tutorial.messages.tip1", "tutorial.messages.tip2", "tutorial.messages.tip3"],
  },
  {
    emoji: "👤",
    titleKey: "tutorial.profile.title",
    textKey: "tutorial.profile.text",
    tipsKeys: ["tutorial.profile.tip1", "tutorial.profile.tip2", "tutorial.profile.tip3", "tutorial.profile.tip4"],
  },
  {
    emoji: "🏘️",
    titleKey: "tutorial.vizinhos.title",
    textKey: "tutorial.vizinhos.text",
    tipsKeys: ["tutorial.vizinhos.tip1", "tutorial.vizinhos.tip2", "tutorial.vizinhos.tip3"],
  },
  {
    emoji: "🔔",
    titleKey: "tutorial.notifications.title",
    textKey: "tutorial.notifications.text",
    tipsKeys: ["tutorial.notifications.tip1", "tutorial.notifications.tip2", "tutorial.notifications.tip3", "tutorial.notifications.tip4", "tutorial.notifications.tip5"],
  },
  {
    emoji: "❓",
    titleKey: "tutorial.help.title",
    textKey: "tutorial.help.text",
    tipsKeys: ["tutorial.help.tip1", "tutorial.help.tip2"],
  },
  {
    emoji: "💡",
    titleKey: "tutorial.tips.title",
    textKey: "tutorial.tips.text",
    tipsKeys: ["tutorial.tips.tip1", "tutorial.tips.tip2", "tutorial.tips.tip3", "tutorial.tips.tip4", "tutorial.tips.tip5", "tutorial.tips.tip6", "tutorial.tips.tip7"],
  },
];

interface TutorialProps {
  onClose: () => void;
}

export default function Tutorial({ onClose }: TutorialProps) {
  const { t } = useT();
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const progress = ((step + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 z-50 flex flex-col items-center justify-center animate-fade-in-up p-6">
      {/* Progress bar */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-purple-400">{step + 1} / {TUTORIAL_STEPS.length}</span>
          <button
            onClick={onClose}
            aria-label={t("tutorial.skip")}
            className="text-[10px] text-purple-500 hover:text-purple-300 transition-colors"
          >
            {t("tutorial.skip")} ✕
          </button>
        </div>
        <div className="h-1 bg-purple-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-purple-900/40 border border-purple-700/40 rounded-3xl p-6 text-center shadow-xl">
        <span className="text-5xl block mb-3 animate-bounce">{current.emoji}</span>
        <h3 className="text-lg font-bold text-white mb-2">{t(current.titleKey)}</h3>
        <p className="text-sm text-purple-200 leading-relaxed">{t(current.textKey)}</p>

        {/* Tips */}
        {current.tipsKeys && current.tipsKeys.length > 0 && (
          <div className="mt-4 space-y-1.5 text-left">
            {current.tipsKeys.map((tipKey, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-400 text-xs mt-0.5">•</span>
                <span className="text-xs text-purple-300 leading-relaxed">{t(tipKey)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-5">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            aria-label={t("tutorial.prev")}
            className="px-5 py-2 rounded-full bg-purple-800/50 text-purple-300 text-sm font-medium hover:bg-purple-700/50 active:scale-95 transition-all"
          >
            ← {t("tutorial.prev")}
          </button>
        )}
        {!isLast ? (
          <button
            onClick={() => setStep(step + 1)}
            aria-label={t("tutorial.next")}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-95 transition-all"
          >
            {t("tutorial.next")} →
          </button>
        ) : (
          <button
            onClick={onClose}
            aria-label={t("tutorial.start")}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 active:scale-95 transition-all"
          >
            ✨ {t("tutorial.start")}
          </button>
        )}
      </div>

      {/* Quick jump dots */}
      <div className="flex gap-1 mt-4 flex-wrap justify-center max-w-xs">
        {TUTORIAL_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            aria-label={`${t("tutorial.goTo")} ${i + 1}`}
            className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center transition-all ${
              i === step
                ? "bg-amber-400 text-purple-900 scale-110 font-bold"
                : i < step
                ? "bg-purple-600 text-purple-200"
                : "bg-purple-800/50 text-purple-500 hover:bg-purple-700/50"
            }`}
          >
            {s.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
