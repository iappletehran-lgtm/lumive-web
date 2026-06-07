/**
 * Backwards-compatible scroll-state shim. Previously a standalone listener;
 * now a thin adapter over the synchronization clock (lib/sync) so that Reveal's
 * "did this enter during a fast flick?" decision uses the exact same velocity
 * signal that drives the lighting breathing and progress bar. One timeline.
 */

import { startSync, getVelocity, getDirection } from "./sync";

export function startScrollState() {
  startSync();
}

export function getScrollVelocity() {
  return getVelocity();
}

export function getScrollDirection() {
  return getDirection();
}
