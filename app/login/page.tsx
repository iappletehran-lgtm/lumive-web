"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { homeForRole } from "@/lib/roles";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Status = "idle" | "submitting";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    setStatus("submitting");
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // GoTrue returns "Invalid login credentials" for both wrong email and
      // wrong password — keep the message non-enumerating but human.
      setError(
        signInError.message === "Invalid login credentials"
          ? t.auth.invalidCredentials
          : signInError.message
      );
      setStatus("idle");
      return;
    }

    // Route by role. The user can read only their own profile row (RLS), so this
    // is a safe, scoped lookup. Default to the prospect home if it is missing.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let role = "prospect";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role) role = profile.role;
    }

    const dest = homeForRole(role);
    router.replace(dest);
    router.refresh(); // let the server (and middleware) see the new session cookie
  }

  return (
    <AuthShell
      logoLabel={t.auth.logoLabel}
      eyebrow={t.auth.loginEyebrow}
      title={
        <>
          {t.auth.loginTitlePre}<span className="gradient-text">{t.auth.loginTitleBrand}</span>
        </>
      }
      subtitle={t.auth.loginSubtitle}
      footer={
        <>
          {t.auth.loginFooterPre}
          <Link href="/register" className="font-medium text-sapphire hover:text-teal">
            {t.auth.loginFooterLink}
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <AuthField
          label={t.auth.workEmail}
          name="email"
          type="email"
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
          required
        />
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="a-password"
              className="font-mono text-[11px] font-medium uppercase tracking-wide text-steel"
            >
              {t.auth.password}
            </label>
          </div>
          <input
            id="a-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={t.auth.passwordPlaceholder}
            className="mt-2 w-full rounded-md border border-cloud bg-white/70 px-4 py-3 text-sm text-midnight placeholder:text-steel/50 focus:border-sapphire focus:bg-white focus:outline-none"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-ember">
            {error}
          </p>
        )}

        <button
          type="submit"
          data-sound="cta"
          disabled={status === "submitting"}
          className="focus-brand glow-cta w-full rounded-md bg-brass px-6 py-3.5 text-base font-semibold text-midnight shadow-md transition-all hover:brightness-95 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? t.auth.signingIn : t.auth.signIn}
        </button>
      </form>
    </AuthShell>
  );
}
