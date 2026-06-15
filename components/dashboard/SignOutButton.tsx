"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/** Signs the user out and returns them to /login. */
export function SignOutButton() {
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      data-sound="nav"
      className="focus-brand rounded-md border border-sapphire/20 bg-white/60 px-4 py-2 text-sm font-medium text-sapphire transition-all hover:bg-white disabled:opacity-60"
    >
      {busy ? t.dash.signingOut : t.dash.signOut}
    </button>
  );
}
