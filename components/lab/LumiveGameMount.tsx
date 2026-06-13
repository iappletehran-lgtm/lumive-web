"use client";

import dynamic from "next/dynamic";

/**
 * Loads the LUMIVE game on the client only. The game uses Tone.js (Web Audio),
 * which must not run during server rendering, so ssr is disabled. The wrapper is
 * `position: relative` + `overflow-hidden` so the game's full-screen fragment
 * modal (position: absolute; inset: 0) stays contained inside the framed card.
 */
const LumiveGame = dynamic(() => import("./LumiveGame"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: 600,
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#444",
        fontSize: 13,
        letterSpacing: 2,
      }}
    >
      LOADING LUMIVE…
    </div>
  ),
});

export function LumiveGameMount() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-xl">
      <LumiveGame />
    </div>
  );
}
