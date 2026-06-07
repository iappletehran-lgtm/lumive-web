"use client";

import { useEffect } from "react";
import { initSound, play, type SoundName } from "@/lib/sound";

/**
 * Global, zero-markup sound layer. Plays a mapped sound when any element with a
 * [data-sound] attribute is clicked. Works with server components (attribute only).
 */
export function SoundController() {
  useEffect(() => {
    initSound();
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("[data-sound]") as HTMLElement | null;
      if (!el) return;
      play((el.dataset.sound as SoundName) || "click");
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  }, []);
  return null;
}
