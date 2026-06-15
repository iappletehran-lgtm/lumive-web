"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang } from "./translations";

const STORAGE_KEY = "lumive-lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (typeof translations)["en"];
  dir: "ltr" | "rtl";
};

const LanguageContext = createContext<Ctx | null>(null);

/**
 * Wraps the app. Default is English on first render (server + first client paint)
 * so there is no hydration mismatch; the stored preference is applied after mount.
 * Sets <html lang/dir> and a `.font-fa` class so RTL + the Persian font flip
 * globally.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Apply stored preference after mount.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "fa" || saved === "en") setLangState(saved);
  }, []);

  // Reflect language at the document level.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "fa" ? "rtl" : "ltr";
    el.classList.toggle("font-fa", lang === "fa");
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable — preference just won't persist */
    }
  };

  const value: Ctx = {
    lang,
    setLang,
    toggle: () => setLang(lang === "fa" ? "en" : "fa"),
    t: translations[lang],
    dir: lang === "fa" ? "rtl" : "ltr",
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within <LanguageProvider>");
  return ctx;
}
