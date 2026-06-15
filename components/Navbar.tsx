"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { SoundToggle } from "./SoundToggle";
import { LanguageToggle } from "./i18n/LanguageToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { startSync, subscribeSync } from "@/lib/sync";

const LINKS = [
  { key: "services", href: "/#services" },
  { key: "howItWorks", href: "/#framework" },
  { key: "lab", href: "/lab" },
  { key: "why", href: "/#why" },
  { key: "about", href: "/#founder" },
  { key: "contact", href: "/#contact" },
] as const;

export function Navbar() {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    startSync();
    let last = false;
    const unsubscribe = subscribeSync((f) => {
      const next = f.scrollY > 12;
      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-360 ease-enter ${
        scrolled
          ? "bg-mist/85 backdrop-blur-md shadow-sm border-b border-cloud/60"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[72px] max-w-container items-center justify-between px-5 lg:px-8">
        <a href="/" className="focus-brand rounded-md" aria-label="Lumive AI home">
          <Logo variant="dark" />
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-sound="nav"
              className="focus-brand rounded text-[15px] font-medium text-midnight/80 transition-colors hover:text-sapphire"
            >
              {t.nav[l.key]}
            </a>
          ))}
          <SoundToggle />
          <a
            href="/login"
            data-sound="nav"
            className="focus-brand rounded text-[15px] font-medium text-midnight/80 transition-colors hover:text-sapphire"
          >
            {t.common.login}
          </a>
          <LanguageToggle />
        </div>

        {/* mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="focus-brand flex h-10 w-10 items-center justify-center rounded-md text-sapphire lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-6 bg-current transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-current transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-current transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </nav>

      {/* mobile menu */}
      {open && (
        <div className="border-t border-cloud/60 bg-mist/95 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-container flex-col gap-1 px-5 py-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                data-sound="nav"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium text-midnight/85 hover:bg-white"
              >
                {t.nav[l.key]}
              </a>
            ))}
            <a
              href="/login"
              data-sound="nav"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium text-midnight/85 hover:bg-white"
            >
              {t.common.login}
            </a>
            <div className="mt-3 flex items-center justify-between border-t border-cloud/60 px-3 pt-3">
              <span className="text-sm font-medium text-steel">{t.nav.sounds}</span>
              <SoundToggle />
            </div>
            <div className="mt-3 flex items-center justify-between px-3">
              <span className="text-sm font-medium text-steel">EN | FA</span>
              <LanguageToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
