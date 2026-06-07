import { SyncController } from "./SyncController";
import { PerceptualLayer } from "./PerceptualLayer";
import { PointerFX } from "./PointerFX";
import { InteractionField } from "./InteractionField";

/**
 * The cinematic experience layer — the single mount that fuses every visual
 * behaviour into one environment:
 *
 *   SyncController   → the shared clock (one scroll listener + one rAF) that all
 *                      motion, lighting, and depth read from, so they move as one.
 *   PerceptualLayer  → ambient focal lighting, per-section colour, depth vignette,
 *                      section-entry bloom (the perceptual + attention systems).
 *   PointerFX        → cursor light + card tilt (desktop), ambient-tinted.
 *   InteractionField → unified tap feedback (glow + sound + motion from one gesture).
 *
 * Mounting these together — rather than as scattered effects — is the point:
 * light, depth, and motion behave as a single coordinated system driven by the
 * same signals (--ambient, --sync-intensity, --atmo-rgb, the sync frame).
 *
 * Sound is intentionally kept separate (opt-in audio, not a visual behaviour).
 */
export function ExperienceLayer() {
  return (
    <>
      <SyncController />
      <PerceptualLayer />
      <PointerFX />
      <InteractionField />
    </>
  );
}
