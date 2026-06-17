"use client";

import { waLink, tgLink } from "@/lib/contact";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.2 4.79 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.8c2.16 0 4.18.84 5.71 2.37a8.06 8.06 0 0 1 2.37 5.74c0 4.48-3.65 8.12-8.12 8.12-1.5 0-2.96-.4-4.24-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.05 8.05 0 0 1-1.25-4.32c0-4.48 3.64-8.12 8.11-8.12zm-2.7 4.1c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01z" />
    </svg>
  );
}

export function TelegramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.07-3.02-1.96 1.91c-.22.22-.4.4-.83.4z" />
    </svg>
  );
}

type Tone = "dark" | "light";

/**
 * Full labelled channel buttons. WhatsApp is the PRIMARY contact CTA (filled,
 * higher weight); Telegram is SECONDARY (outline). Both open in a new tab.
 */
export function ChannelButtons({
  tone = "light",
  className = "",
}: {
  tone?: Tone;
  className?: string;
}) {
  const { t } = useLanguage();
  const base =
    "focus-brand inline-flex items-center gap-2.5 rounded-md px-5 py-2.5 text-sm font-semibold transition-all";

  // Primary (WhatsApp): filled, strong contrast on each tone.
  const primary =
    tone === "dark"
      ? "bg-mist text-midnight shadow-md hover:brightness-95 hover:shadow-lg"
      : "bg-sapphire text-mist shadow-md hover:brightness-110 hover:shadow-lg";
  // Secondary (Telegram): outline.
  const secondary =
    tone === "dark"
      ? "border border-mist/25 text-mist hover:border-lumive-light/60 hover:text-lumive-light"
      : "border border-sapphire/25 text-sapphire hover:border-teal hover:text-teal";

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <a
        href={waLink()}
        target="_blank"
        rel="noopener noreferrer"
        data-sound="cta"
        aria-label="Talk to Lumive AI on WhatsApp"
        className={`${base} ${primary}`}
      >
        <WhatsAppIcon className="h-[18px] w-[18px]" />
        Talk on WhatsApp
      </a>
      <a
        href={tgLink()}
        target="_blank"
        rel="noopener noreferrer"
        data-sound="nav"
        aria-label={t.channels.telegram}
        className={`${base} ${secondary}`}
      >
        <TelegramIcon className="h-[18px] w-[18px]" />
        {t.channels.telegram}
      </a>
    </div>
  );
}

/** Compact icon-only channel links — for tight spaces like the assistant header. */
export function ChannelIcons({
  tone = "light",
  className = "",
}: {
  tone?: Tone;
  className?: string;
}) {
  const { t } = useLanguage();
  const btn =
    "focus-brand flex h-8 w-8 items-center justify-center rounded-full transition-colors";
  const styles =
    tone === "dark"
      ? "bg-white/10 text-cloud/80 hover:bg-white/20 hover:text-mist"
      : "bg-sapphire/8 text-sapphire hover:bg-teal/12 hover:text-teal";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <a
        href={waLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Lumive AI on WhatsApp"
        title="Chat with Lumive AI on WhatsApp"
        className={`${btn} ${styles}`}
      >
        <WhatsAppIcon className="h-4 w-4" />
      </a>
      <a
        href={tgLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.channels.telegram}
        title={t.channels.telegram}
        className={`${btn} ${styles}`}
      >
        <TelegramIcon className="h-4 w-4" />
      </a>
    </div>
  );
}
