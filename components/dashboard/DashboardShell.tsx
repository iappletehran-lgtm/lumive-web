import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "./SignOutButton";

/**
 * Shared chrome for the authenticated app pages. A thin glass top bar (logo +
 * signed-in identity + sign out) over the same brand canvas the marketing site
 * uses, then a centred content column with an eyebrow + display heading — so the
 * portal reads as the same product, not a separate tool.
 */
export function DashboardShell({
  eyebrow,
  title,
  subtitle,
  email,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  email?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="dot-grid pointer-events-none absolute inset-0" aria-hidden />

      <header className="glass-tint sticky top-0 z-[var(--z-nav)] border-b border-white/60">
        <div className="mx-auto flex max-w-container items-center justify-between px-5 py-3.5 lg:px-8">
          <Link href="/" prefetch={false} data-sound="nav" className="focus-brand rounded-md" aria-label="Lumive AI — home">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            {email && (
              <span className="hidden text-sm text-steel sm:inline">{email}</span>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-container px-5 py-12 lg:px-8 lg:py-16">
        <header className="mb-9">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
            {eyebrow}
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-sapphire lg:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-steel">{subtitle}</p>
          )}
        </header>
        {children}
      </main>
    </div>
  );
}
