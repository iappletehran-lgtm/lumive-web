"use client";

import { useEffect } from "react";
import { startSync } from "@/lib/sync";

/**
 * Mounts the synchronization clock once for the whole app. startSync() is
 * idempotent, so individual consumers may also call it — this guarantees the
 * shared timeline runs even on pages where no other consumer happens to.
 */
export function SyncController() {
  useEffect(() => {
    startSync();
  }, []);
  return null;
}
