"use client";

import { useState } from "react";

/**
 * Interactive workflow visual for the AI Receptionist card.
 * Inputs (Chat / Web / Phone) → Lumive AI Core → outputs (Book / Answer / Qualify).
 * Hovering an input glows it teal, pulses its line into the core, brightens the
 * core, and lights the outputs one by one. Pure CSS animations; React only tracks
 * which input is hovered. Custom stroke icons (sapphire → teal). Mobile-friendly.
 */

const INPUTS = [
  { icon: "chat", label: "Chat" },
  { icon: "web", label: "Web" },
  { icon: "phone", label: "Phone" },
];
const OUTPUTS = [
  { icon: "book", label: "Book" },
  { icon: "answer", label: "Answer" },
  { icon: "qualify", label: "Qualify" },
];

const COLX = [16, 50, 84]; // node column anchors (% of width)
const IN_Y = 13; // input row (% of height)
const OUT_Y = 87; // output row
const CX = 50;
const CY = 50; // core

/** Stroke-based, 1.5px, 20×20 icons on a 24-unit grid. Colour via currentColor. */
function FlowIcon({ name }: { name: string }) {
  const p = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "chat": // speech bubble with a small dot inside
      return (
        <svg {...p}>
          <path d="M5 4h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <circle cx="12" cy="9" r="1.15" fill="currentColor" stroke="none" />
        </svg>
      );
    case "web": // globe with two horizontal lines
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M4 9.5h16M4 14.5h16" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
        </svg>
      );
    case "phone": // handset, slightly rotated
      return (
        <svg {...p}>
          <g transform="rotate(-8 12 12)">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
          </g>
        </svg>
      );
    case "book": // calendar with a small checkmark
      return (
        <svg {...p}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v3M16 3v3M8.5 14.5l2.5 2.5 4-4.5" />
        </svg>
      );
    case "answer": // reply arrow with lines
      return (
        <svg {...p}>
          <polyline points="9 15 5 11 9 7" />
          <path d="M5 11h8a5 5 0 0 1 5 5v1M14 6h5M14 9h3" />
        </svg>
      );
    case "qualify": // checkmark inside a circle
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.5 2.5 4.5-5" />
        </svg>
      );
    default:
      return null;
  }
}

export function ReceptionistFlow() {
  const [active, setActive] = useState<number | null>(null);
  const on = active !== null;

  return (
    <div className="rf-wrap" aria-hidden>
      <style>{CSS}</style>
      <div className="rf-stage">
        {/* connecting lines */}
        <svg className="rf-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {COLX.map((x, i) => (
            <line
              key={`in-${i}`}
              x1={x}
              y1={IN_Y}
              x2={CX}
              y2={CY}
              className={`rf-line ${active === i ? "is-active" : ""}`}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {COLX.map((x, i) => (
            <line
              key={`out-${i}`}
              x1={CX}
              y1={CY}
              x2={x}
              y2={OUT_Y}
              className={`rf-line ${on ? "is-active" : ""}`}
              style={{ animationDelay: `${i * 0.12}s` }}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* input nodes */}
        {INPUTS.map((n, i) => (
          <div key={n.label} className="rf-anchor" style={{ left: `${COLX[i]}%`, top: `${IN_Y}%` }}>
            <button
              type="button"
              className={`rf-node rf-input ${active === i ? "is-on" : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive((p) => (p === i ? null : i))}
            >
              <span className="rf-ico">
                <FlowIcon name={n.icon} />
              </span>
              <span className="rf-lbl">{n.label}</span>
            </button>
          </div>
        ))}

        {/* core */}
        <div className="rf-anchor" style={{ left: `${CX}%`, top: `${CY}%` }}>
          <div className={`rf-core ${on ? "is-active" : ""}`}>
            <span className="rf-core-lbl">Lumive AI</span>
            <span className="rf-core-sub">Core</span>
          </div>
        </div>

        {/* output nodes */}
        {OUTPUTS.map((n, i) => (
          <div key={n.label} className="rf-anchor" style={{ left: `${COLX[i]}%`, top: `${OUT_Y}%` }}>
            <div
              className={`rf-node rf-output ${on ? "is-lit" : ""}`}
              style={{ transitionDelay: on ? `${i * 0.15}s` : "0s" }}
            >
              <span className="rf-ico">
                <FlowIcon name={n.icon} />
              </span>
              <span className="rf-lbl">{n.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CSS = `
.rf-wrap{position:relative;width:100%}
.rf-stage{position:relative;width:100%;max-width:520px;height:260px;margin:0 auto}
@media (min-width:640px){.rf-stage{height:228px}}
.rf-lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.rf-line{fill:none;stroke:#5B7FA6;stroke-width:1.5;stroke-dasharray:3 6;opacity:.4;animation:rfFlow 1.8s linear infinite}
.rf-line.is-active{stroke:#1A8C6B;opacity:1;stroke-width:2;animation-duration:.8s}
.rf-anchor{position:absolute;transform:translate(-50%,-50%)}
.rf-node{display:flex;flex-direction:column;align-items:center;gap:4px;width:74px;padding:9px 6px;border-radius:12px;cursor:pointer;background:none;font:inherit;text-align:center;transition:transform .3s cubic-bezier(.4,0,.2,1),box-shadow .3s,border-color .3s,background .3s}
.rf-ico{display:flex;align-items:center;justify-content:center;height:20px;color:#1B3F72;transition:color .3s}
.rf-lbl{font-size:11px;font-weight:600;color:#1B3F72;letter-spacing:.2px}
.rf-input{border:1px solid #CBD5E0;background:rgba(255,255,255,.72);box-shadow:0 1px 2px rgba(14,28,47,.06)}
.rf-input:hover,.rf-input:focus-visible,.rf-input.is-on{border-color:#1A8C6B;background:rgba(255,255,255,.96);box-shadow:0 6px 18px -6px rgba(26,140,107,.45);transform:translateY(-2px);outline:none}
.rf-input:hover .rf-ico,.rf-input:focus-visible .rf-ico,.rf-input.is-on .rf-ico{color:#1A8C6B}
.rf-output{border:1px solid rgba(26,140,107,.22);background:rgba(26,140,107,.07);box-shadow:0 1px 2px rgba(14,28,47,.05)}
.rf-output.is-lit{border-color:#1A8C6B;background:rgba(26,140,107,.16);box-shadow:0 6px 18px -6px rgba(26,140,107,.5);transform:translateY(-2px)}
.rf-output.is-lit .rf-ico{color:#1A8C6B}
.rf-core{display:flex;flex-direction:column;align-items:center;justify-content:center;width:124px;height:56px;border-radius:14px;color:#E8EFF9;background:var(--grad-brand,linear-gradient(100deg,#1B3F72 0%,#1A8C6B 60%,#3DBFA3 100%));box-shadow:0 8px 22px -10px rgba(27,63,114,.5);animation:rfCorePulse 2.6s ease-in-out infinite}
.rf-core.is-active{animation-duration:1.1s;box-shadow:0 10px 28px -8px rgba(27,63,114,.7),0 0 0 6px rgba(61,191,163,.14)}
.rf-core-lbl{font-size:14px;font-weight:700;letter-spacing:.3px;line-height:1.1}
.rf-core-sub{font-size:8px;font-weight:600;letter-spacing:2px;text-transform:uppercase;opacity:.75;margin-top:1px}
@keyframes rfFlow{to{stroke-dashoffset:-18}}
@keyframes rfCorePulse{0%,100%{box-shadow:0 8px 22px -10px rgba(27,63,114,.5),0 0 0 0 rgba(61,191,163,0)}50%{box-shadow:0 10px 26px -8px rgba(27,63,114,.6),0 0 0 7px rgba(61,191,163,.1)}}
@media (prefers-reduced-motion:reduce){.rf-line{animation:none}.rf-core{animation:none}}
`;
