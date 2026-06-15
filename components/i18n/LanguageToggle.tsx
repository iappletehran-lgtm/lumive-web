"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * EN | FA segmented toggle. Always rendered LTR so the order is stable in both
 * languages. Reflects + sets the active language (persisted in localStorage).
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <div
      dir="ltr"
      role="group"
      aria-label="Language"
      className={`inline-flex items-center overflow-hidden rounded-md border border-sapphire/20 bg-white/60 ${className}`}
    >
      {(["en", "fa"] as const).map((l, i) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          data-sound="nav"
          className={`focus-brand px-2.5 py-1 font-mono text-[12px] font-semibold uppercase tracking-wide transition-colors ${
            i === 1 ? "border-l border-sapphire/15" : ""
          } ${lang === l ? "bg-sapphire text-mist" : "text-sapphire hover:bg-white"}`}
        >
          {l === "en" ? "EN" : "FA"}
        </button>
      ))}
    </div>
  );
}
