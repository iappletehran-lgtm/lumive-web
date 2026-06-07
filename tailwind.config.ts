import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Lumive AI palette (brand-governed). Semantic roles:
      //   primary   = sapphire   secondary = teal        accent = lumive-light
      //   cta       = brass      canvas    = mist         depth  = slate-indigo
      //   text      = midnight   muted     = steel        border = cloud
      //   danger    = ember
      // Single source of truth for the JS side: lib/brand.ts
      colors: {
        sapphire: "#1B3F72",
        teal: "#1A8C6B",
        mist: "#E8EFF9",
        brass: "#C9A84C",
        "slate-indigo": "#5B7FA6",
        "lumive-light": "#3DBFA3",
        ember: "#F2746B",
        midnight: "#0E1C2F",
        steel: "#4A5568",
        cloud: "#CBD5E0",
      },
      // Signature gradients — reference the single CSS-var definitions in
      // globals.css so bg-grad-* matches gradient-text / progress bar exactly.
      backgroundImage: {
        "grad-brand": "var(--grad-brand)",
        "grad-brand-h": "var(--grad-brand-h)",
        "grad-spark": "var(--grad-spark)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        container: "1200px",
        text: "680px",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(14,28,47,.06)",
        md: "0 4px 16px rgba(14,28,47,.08)",
        lg: "0 12px 32px rgba(14,28,47,.10)",
        xl: "0 24px 64px rgba(14,28,47,.14)",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(.4,0,.2,1)",      // balanced in-out — hover/ambient
        enter: "cubic-bezier(0.16, 1, 0.3, 1)", // decelerate-in — elements entering view
        exit:  "cubic-bezier(0.4, 0, 1, 1)",    // accelerate-out — elements leaving
      },
      transitionDuration: {
        "360": "360ms",  // component transitions (card hover, nav)
        "560": "560ms",  // section reveals
        "720": "720ms",  // cinematic scene entry
        "900": "900ms",  // ambient/color shifts
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "drift": {
          "0%, 100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(2%,-3%)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(-12px,8px)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 560ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
        "drift":      "drift 24s ease-in-out infinite",
        "float":      "float 9s ease-in-out infinite",
        "float-slow": "float-slow 16s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
