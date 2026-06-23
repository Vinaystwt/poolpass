import type { Config } from "tailwindcss";

// Tokens mapped verbatim from DESIGN.md (Stripe-inspired). Values resolve to CSS
// variables defined in app/globals.css so the same Tailwind class flips between
// the light and dark themes. The --accent-proof variable is the one PoolPass
// addition: a violet reserved exclusively for proof / verification UI.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // surfaces / text are theme-aware via CSS vars
        canvas: "var(--canvas)",
        "canvas-soft": "var(--canvas-soft)",
        "canvas-cream": "var(--canvas-cream)",
        card: "var(--card)",
        hairline: "var(--hairline)",
        "hairline-input": "var(--hairline-input)",
        ink: "var(--ink)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-mute": "var(--ink-mute)",
        "on-primary": "var(--on-primary)",
        // brand
        primary: "var(--primary)",
        "primary-deep": "var(--primary-deep)",
        "primary-press": "var(--primary-press)",
        "primary-soft": "var(--primary-soft)",
        "primary-subdued": "var(--primary-subdued)",
        "brand-dark": "var(--brand-dark)",
        ruby: "#ea2261",
        magenta: "#f96bee",
        lemon: "#9b6829",
        // PoolPass ZK accent
        "accent-proof": "var(--accent-proof)",
        "accent-proof-soft": "var(--accent-proof-soft)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "SF Pro Display", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // [size, { lineHeight, letterSpacing }] — DESIGN.md typography scale
        "display-xxl": ["56px", { lineHeight: "1.03", letterSpacing: "-1.4px", fontWeight: "300" }],
        "display-xl": ["48px", { lineHeight: "1.15", letterSpacing: "-0.96px", fontWeight: "300" }],
        "display-lg": ["32px", { lineHeight: "1.1", letterSpacing: "-0.64px", fontWeight: "300" }],
        "display-md": ["26px", { lineHeight: "1.12", letterSpacing: "-0.26px", fontWeight: "300" }],
        "heading-lg": ["22px", { lineHeight: "1.1", letterSpacing: "-0.22px", fontWeight: "300" }],
        "heading-md": ["20px", { lineHeight: "1.4", letterSpacing: "-0.2px", fontWeight: "300" }],
        "heading-sm": ["18px", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "300" }],
        "body-lg": ["16px", { lineHeight: "1.4", letterSpacing: "0" }],
        "body-md": ["15px", { lineHeight: "1.4", letterSpacing: "0" }],
        "body-tabular": ["14px", { lineHeight: "1.4", letterSpacing: "-0.42px" }],
        caption: ["13px", { lineHeight: "1.4", letterSpacing: "-0.39px" }],
        micro: ["11px", { lineHeight: "1.4", letterSpacing: "0" }],
        "micro-cap": ["10px", { lineHeight: "1.15", letterSpacing: "0.1px", fontWeight: "400" }],
      },
      spacing: {
        xxs: "2px",
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        xxl: "32px",
        huge: "64px",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },
      boxShadow: {
        e1: "rgba(0,55,112,0.08) 0 1px 3px",
        e2: "rgba(0,55,112,0.08) 0 8px 24px, rgba(0,55,112,0.04) 0 2px 6px",
        "proof-glow": "0 0 0 1px var(--accent-proof-soft), 0 8px 32px rgba(124,92,255,0.18)",
      },
      maxWidth: {
        container: "1200px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 240ms ease-out both",
        "pulse-ring": "pulse-ring 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
