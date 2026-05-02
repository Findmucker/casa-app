"use client";

import { useState, useEffect, useCallback } from "react";

export type TimePhase = "morning" | "afternoon" | "dusk" | "night";

export interface ThemeConfig {
  phase: TimePhase;
  cssClass: string;
  bgGradient: string;
  isDark: boolean;
}

const THEMES: Record<TimePhase, ThemeConfig> = {
  morning: {
    phase: "morning",
    cssClass: "theme-morning",
    bgGradient: "from-amber-50/80 via-orange-50/40 to-yellow-50/60",
    isDark: false,
  },
  afternoon: {
    phase: "afternoon",
    cssClass: "",
    bgGradient: "from-rose-50/80 via-pink-50 to-fuchsia-50/60",
    isDark: false,
  },
  dusk: {
    phase: "dusk",
    cssClass: "theme-dusk",
    bgGradient: "from-orange-50 via-rose-100 to-purple-100/80",
    isDark: false,
  },
  night: {
    phase: "night",
    cssClass: "dark-mode",
    bgGradient: "from-pink-100 via-purple-100 to-indigo-100",
    isDark: true,
  },
};

// === Selectable Theme System ===

export type ThemeId = "auto" | "cyberpunk";

export interface SelectableTheme {
  id: ThemeId;
  emoji: string;
  nameKey: string;
  descKey: string;
  preview: string; // tailwind gradient classes for swatch
}

export const SELECTABLE_THEMES: SelectableTheme[] = [
  { id: "auto", emoji: "🌤️", nameKey: "themes.auto", descKey: "themes.autoDesc", preview: "from-rose-200 via-purple-100 to-amber-100" },
  { id: "cyberpunk", emoji: "⚡", nameKey: "themes.cyberpunk", descKey: "themes.cyberpunkDesc", preview: "from-cyan-400 via-gray-900 to-fuchsia-500" },
];

const OVERRIDE_THEMES: Record<Exclude<ThemeId, "auto">, ThemeConfig> = {
  cyberpunk: {
    phase: "night",
    cssClass: "theme-cyberpunk",
    bgGradient: "from-[#0a0a1a] via-[#1a0030] to-[#0a0a1a]",
    isDark: true,
  },
};

const STORAGE_KEY = "casa-theme";

export function getTimePhase(hour: number): TimePhase {
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 20) return "dusk";
  return "night";
}

export function getTheme(phase: TimePhase): ThemeConfig {
  return THEMES[phase];
}

export function useThemeOverride(): [ThemeId, (id: ThemeId) => void] {
  const [override, setOverrideState] = useState<ThemeId>("auto");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && stored !== "auto") {
      setOverrideState(stored);
    }
  }, []);

  const setOverride = useCallback((id: ThemeId) => {
    setOverrideState(id);
    if (id === "auto") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  return [override, setOverride];
}

export function useTimeTheme(): ThemeConfig & { themeId: ThemeId; setThemeId: (id: ThemeId) => void } {
  const [override, setOverride] = useThemeOverride();

  const [timeTheme, setTimeTheme] = useState<ThemeConfig>(() => {
    const hour = new Date().getHours();
    return THEMES[getTimePhase(hour)];
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const newTheme = THEMES[getTimePhase(hour)];
      setTimeTheme((prev) => (prev.phase !== newTheme.phase ? newTheme : prev));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeTheme = override === "auto" ? timeTheme : OVERRIDE_THEMES[override];

  return { ...activeTheme, themeId: override, setThemeId: setOverride };
}
