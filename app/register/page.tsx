"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";

type Status = "idle" | "submitting" | "done";

export default function RegisterPage() {
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

    setEmail(emailValue);
    setStatus("done");
  }

  if (status === "done") {
    return (
      <AuthShell eyebrow="One more step" title="Check your email to confirm.">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/15 text-xl text-teal">
            ✓
          </span>
          <p className="mt-5 leading-relaxed text-steel">
            We sent a confirmation link to{" "}
            <span className="font-medium text-midnight">{email}</span>. Open it to
            activate your account, then sign in.
          </p>
          <Link
            href="/login"
            data-sound="nav"
            className="focus-brand mt-7 inline-flex w-full items-center justify-center rounded-md border border-sapphire/25 bg-white/60 px-6 py-3.5 text-base font-semibold text-sapphire transition-all hover:bg-white"
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Create your account"
      title={
        <>
          Start with <span className="gradient-text">Lumive.</span>
        </>
      }
      subtitle="One account for your projects and the 90-day build."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-sapphire hover:text-teal">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <AuthField
          label="Full name"
          name="full_name"
          placeholder="Your name"
          autoComplete="name"
          required
        />
        <AuthField
          label="Company"
          name="company"
          placeholder="Company name"
          autoComplete="organization"
          required
        />
        <AuthField
          label="Work email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
        <div>
          <label
            htmlFor="a-password"
            className="font-mono text-[11px] font-medium uppercase tracking-wide text-steel"
          >
            Password
          </label>
          <input
            id="a-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
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
          {status === "submitting" ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-xs leading-relaxed text-steel/70">
          We use your details only to run your projects. We never share them.
        </p>
      </form>
    </AuthShell>
  );
}
