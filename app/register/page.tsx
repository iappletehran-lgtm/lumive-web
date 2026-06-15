"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Status = "idle" | "submitting" | "done";

export default function RegisterPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fullName = String(data.get("full_name") || "").trim();
    const company = String(data.get("company") || "").trim();
    const emailValue = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    setStatus("submitting");
    setError("");

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: emailValue,
      password,
      options: {
        // The handle_new_user trigger reads full_name from user metadata; company
        // is carried too so the profile can be enriched later.
        data: { full_name: fullName, company },
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setStatus("idle");
      return;
    }

    // Fire the welcome email server-side (fire-and-forget; never blocks the UX).
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email: emailValue }),
    }).catch(() => {});

    setEmail(emailValue);
    setStatus("done");
  }

  if (status === "done") {
    return (
      <AuthShell logoLabel={t.auth.logoLabel} eyebrow={t.auth.confirmEyebrow} title={t.auth.confirmTitle}>
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/15 text-xl text-teal">
            ✓
          </span>
          <p className="mt-5 leading-relaxed text-steel">
            {t.auth.confirmBodyPre}
            <span className="font-medium text-midnight">{email}</span>
            {t.auth.confirmBodyPost}
          </p>
          <Link
            href="/login"
            data-sound="nav"
            className="focus-brand mt-7 inline-flex w-full items-center justify-center rounded-md border border-sapphire/25 bg-white/60 px-6 py-3.5 text-base font-semibold text-sapphire transition-all hover:bg-white"
          >
            {t.auth.backToSignIn}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      logoLabel={t.auth.logoLabel}
      eyebrow={t.auth.registerEyebrow}
      title={
        <>
          {t.auth.registerTitlePre}<span className="gradient-text">{t.auth.registerTitleBrand}</span>
        </>
      }
      subtitle={t.auth.registerSubtitle}
      footer={
        <>
          {t.auth.registerFooterPre}
          <Link href="/login" className="font-medium text-sapphire hover:text-teal">
            {t.auth.registerFooterLink}
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <AuthField
          label={t.auth.fullName}
          name="full_name"
          placeholder={t.auth.fullNamePlaceholder}
          autoComplete="name"
          required
        />
        <AuthField
          label={t.auth.company}
          name="company"
          placeholder={t.auth.companyPlaceholder}
          autoComplete="organization"
          required
        />
        <AuthField
          label={t.auth.workEmail}
          name="email"
          type="email"
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
          required
        />
        <div>
          <label
            htmlFor="a-password"
            className="font-mono text-[11px] font-medium uppercase tracking-wide text-steel"
          >
            {t.auth.password}
          </label>
          <input
            id="a-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={t.auth.newPasswordPlaceholder}
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
          {status === "submitting" ? t.auth.creatingAccount : t.auth.createAccount}
        </button>

        <p className="text-center text-xs leading-relaxed text-steel/70">
          {t.auth.privacyNote}
        </p>
      </form>
    </AuthShell>
  );
}
