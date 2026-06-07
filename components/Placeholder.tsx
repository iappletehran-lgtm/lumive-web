/** Small badge marking content that needs final confirmation. */
export function PlaceholderTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm border border-brass/50 bg-brass/10 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-brass"
      title="Placeholder — confirm before launch"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brass" />
      {children}
    </span>
  );
}
