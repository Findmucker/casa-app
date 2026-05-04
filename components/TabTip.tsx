"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import type { LocaleKeys } from "@/lib/locales/pt";

interface TabTipProps {
  tabId: string;
  emoji: string;
  titleKey: LocaleKeys;
  tips: LocaleKeys[];
}

export default function TabTip({ tabId, emoji, titleKey, tips }: TabTipProps) {
  const { t } = useT();
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const key = `casa-tab-seen-${tabId}`;
    if (!localStorage.getItem(key)) {
      setVisible(true);
    }
  }, [tabId]);

  const dismiss = () => {
    setDismissing(true);
    localStorage.setItem(`casa-tab-seen-${tabId}`, "true");
    setTimeout(() => setVisible(false), 200);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center p-6 transition-opacity duration-200 ${
        dismissing ? "opacity-0" : "opacity-100 animate-fade-in-up"
      }`}
      style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-pink-100/50"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-4xl block text-center mb-3">{emoji}</span>
        <h3 className="text-base font-bold text-rose-600 text-center mb-3">{t(titleKey)}</h3>

        {tips.length > 0 && (
          <div className="space-y-2 mb-4">
            {tips.map((tipKey, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-rose-400 text-xs mt-0.5">•</span>
                <span className="text-xs text-gray-600 leading-relaxed">{t(tipKey)}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={dismiss}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 text-white text-sm font-semibold active:scale-[0.98] transition-all"
        >
          {t("tutorial.dismiss")}
        </button>
      </div>
    </div>
  );
}
