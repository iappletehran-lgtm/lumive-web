"use client";

import { useEffect, useRef, useState } from "react";
import { startScrollState, getScrollVelocity } from "@/lib/scrollState";

// px/ms above which a reveal is considered "mid-flick" and snaps in fast.
const SNAP_VELOCITY = 2.0;

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [snap, setSnap] = useState(false);

  useEffect(() => {
    startScrollState();
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            // Context-aware: if revealed during a fast scroll, snap in so the
            // content is never seen mid-fade. Calm scroll keeps the full reveal.
            if (getScrollVelocity() > SNAP_VELOCITY) setSnap(true);
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${snap ? "reveal-snap" : ""} ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: snap ? "0ms" : `${delay}ms` }}
    >
      {children}
    </div>
  );
}
