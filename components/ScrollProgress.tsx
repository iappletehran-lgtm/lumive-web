"use client";

import { useEffect } from "react";
import { startSync } from "@/lib/sync";

/**
 * Thin gradient progress bar. Reads --scroll-progress straight from the
 * synchronization clock (lib/sync), so it advances on the exact same timeline
 * as the lighting and storytelling — no separate scroll listener, no drift.
 */
export function ScrollProgress() {
  useEffect(() => {
    startSync();
  }, []);

  return (
    <div
      className="scroll-progress w-full"
      style={{ transform: "scaleX(var(--scroll-progress, 0))" }}
      aria-hidden
    />
  );
}
