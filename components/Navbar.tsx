"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { SoundToggle } from "./SoundToggle";
import { startSync, subscribeSync } from "@/lib/sync";
import { BOOK_URL } from "@/lib/contact";

const LINKS = [
  { label: "Services", href: "/#services" },
  { label: "How It Works", href: "/#framework" },
  { label: "Lumive Lab", href: "/lab" },
  { label: "Why Lumive", href: "/#why" },
  { label: "About", href: "/#founder" },
  { label: "Contact", href: "/#contact" },
];

export function Navbar() {
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
              {l.label}
            </a>
          ))}
          <SoundToggle />
          <a
            href="/login"
            data-sound="nav"
            className="focus-brand rounded text-[15px] font-medium text-midnight/80 transition-colors hover:text-sapphire"
          >
            Login
          </a>
          <a
            href={BOOK_URL}
            data-sound="cta"
            className="focus-brand glow-cta rounded-md bg-brass px-5 py-2.5 text-[15px] font-semibold text-midnight shadow-sm transition-all duration-200 ease-brand hover:brightness-95"
          >
            Book a Call
          </a>
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
                {l.label}
              </a>
            ))}
            <a
              href="/login"
              data-sound="nav"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium text-midnight/85 hover:bg-white"
            >
              Login
            </a>
            <a
              href={BOOK_URL}
              data-sound="cta"
              onClick={() => setOpen(false)}
              className="glow-cta mt-2 rounded-md bg-brass px-5 py-3 text-center text-base font-semibold text-midnight"
            >
              Book a Call
            </a>
            <div className="mt-3 flex items-center justify-between border-t border-cloud/60 px-3 pt-3">
              <span className="text-sm font-medium text-steel">Interface sounds</span>
              <SoundToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
