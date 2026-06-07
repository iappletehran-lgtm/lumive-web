"use client";

import { useEffect, useState } from "react";
import { initSound, isEnabled, setEnabled, subscribe, play } from "@/lib/sound";

export function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    initSound();
    setOn(isEnabled());
    return subscribe(() => setOn(isEnabled()));
  }, []);

  const toggle = () => {
    const next = !isEnabled();
    setEnabled(next);
    if (next) play("toggle");
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Turn interface sounds off" : "Turn interface sounds on"}
      title={on ? "Sound on" : "Sound off"}
      className={`focus-brand inline-flex h-9 w-9 items-center justify-center rounded-md text-sapphire/70 transition-colors hover:bg-sapphire/5 hover:text-sapphire ${className}`}
    >
      {on ? (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H3v6h3l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 010 7" />
          <path d="M18.5 6a9 9 0 010 12" />
        </svg>
      ) : (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H3v6h3l5 4V5z" />
          <path d="M22 9l-6 6M16 9l6 6" />
        </svg>
      )}
    </button>
  );
}
