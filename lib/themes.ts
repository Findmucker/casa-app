"use client";

import { useState, useEffect } from "react";

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
    bgGradient: "from-amber-50 via-yellow-50 to-orange-50",
    isDark: false,
  },
  afternoon: {
    phase: "afternoon",
    cssClass: "",
    bgGradient: "from-pink-50 via-rose-50 to-purple-50",
    isDark: false,
  },
  dusk: {
    phase: "dusk",
    cssClass: "theme-dusk",
    bgGradient: "from-orange-100 via-rose-200 to-purple-200",
    isDark: false,
  },
  night: {
    phase: "night",
    cssClass: "dark-mode",
    bgGradient: "from-[#363258] via-[#453d6e] to-[#363258]",
    isDark: true,
  },
};

export function getTimePhase(hour: number): TimePhase {
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 20) return "dusk";
  return "night";
}

export function getTheme(phase: TimePhase): ThemeConfig {
  return THEMES[phase];
}

export function useTimeTheme(): ThemeConfig {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const hour = new Date().getHours();
    return THEMES[getTimePhase(hour)];
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const newTheme = THEMES[getTimePhase(hour)];
      setTheme((prev) => (prev.phase !== newTheme.phase ? newTheme : prev));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return theme;
}
