"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { pt, type LocaleKeys } from "./locales/pt";
import { en } from "./locales/en";

export type Locale = "pt" | "en";

const dictionaries: Record<Locale, Record<string, string | readonly string[]>> = { pt, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: LocaleKeys) => string;
  tArray: (key: LocaleKeys) => readonly string[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    const saved = localStorage.getItem("casa-locale") as Locale | null;
    if (saved && (saved === "pt" || saved === "en")) {
      setLocaleState(saved); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("casa-locale", l);
  }, []);

  const t = useCallback((key: LocaleKeys): string => {
    const val = dictionaries[locale][key];
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return val.join(", ");
    return key;
  }, [locale]);

  const tArray = useCallback((key: LocaleKeys): readonly string[] => {
    const val = dictionaries[locale][key];
    if (Array.isArray(val)) return val;
    return [String(val || key)];
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tArray }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be inside LocaleProvider");
  return ctx;
}
