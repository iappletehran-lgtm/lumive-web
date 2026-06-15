"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * A click-to-copy value field. The whole control is the copy button so it is
 * easy to tap on a phone; it shows a brief "Copied" confirmation. Used for the
 * wallet address on the payment page.
 */
export function CopyField({ value, ariaLabel }: { value: string; ariaLabel?: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      data-sound="nav"
      aria-label={ariaLabel ?? "Copy to clipboard"}
      className="focus-brand group flex w-full items-center gap-3 rounded-md border border-cloud bg-white/70 px-4 py-3 text-left transition-colors hover:bg-white"
    >
      <span className="min-w-0 flex-1 break-all font-mono text-[13px] leading-relaxed text-midnight" dir="ltr">
        {value}
      </span>
      <span
        className={`shrink-0 rounded px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide transition-colors ${
          copied ? "bg-teal/15 text-teal" : "bg-sapphire/8 text-sapphire group-hover:bg-sapphire/12"
        }`}
      >
        {copied ? t.book.copied : t.book.copy}
      </span>
    </button>
  );
}
