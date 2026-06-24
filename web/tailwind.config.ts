import type { Config } from "tailwindcss";

// PoolPass visual system. The violet --accent is reserved for proof UI and the
// single primary CTA per page; generic interactive elements resolve through ink
// and hairline. The legacy `primary` key is intentionally repointed to ink so any
// stray generic usage stays neutral, never violet.
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
        canvas: "var(--canvas)",
        "canvas-soft": "var(--canvas-soft)",
        "canvas-sunken": "var(--canvas-sunken)",
        "canvas-cream": "var(--canvas-soft)",
        card: "var(--card)",
        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",
        "hairline-input": "var(--hairline-strong)",
        ink: "var(--ink)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-mute": "var(--ink-mute)",
        "on-accent": "var(--on-accent)",
        "on-primary": "var(--on-accent)",
        // reserved proof accent
        accent: "var(--accent)",
        "accent-deep": "var(--accent-deep)",
        "accent-press": "var(--accent-press)",
        "accent-soft": "var(--accent-soft)",
        "accent-ring": "var(--accent-ring)",
        "accent-proof": "var(--accent)",
        // semantic
        positive: "var(--positive)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        ruby: "var(--danger)",
        magenta: "var(--accent)",
        lemon: "var(--warning)",
        // legacy generic key -> ink (never violet)
        primary: "var(--ink)",
        "primary-deep": "var(--ink)",
        "primary-press": "var(--ink)",
        "primary-soft": "var(--ink-secondary)",
        "primary-subdued": "var(--canvas-sunken)",
        "brand-dark": "var(--ink)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter Tight", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-xxl": ["56px", { lineHeight: "1.04", letterSpacing: "-1.6px", fontWeight: "500" }],
        "display-xl": ["46px", { lineHeight: "1.08", letterSpacing: "-1px", fontWeight: "500" }],
        "display-lg": ["32px", { lineHeight: "1.1", letterSpacing: "-0.6px", fontWeight: "500" }],
        "display-md": ["25px", { lineHeight: "1.15", letterSpacing: "-0.3px", fontWeight: "500" }],
        "heading-lg": ["21px", { lineHeight: "1.2", letterSpacing: "-0.2px", fontWeight: "500" }],
        "heading-md": ["19px", { lineHeight: "1.35", letterSpacing: "-0.2px", fontWeight: "500" }],
        "heading-sm": ["16px", { lineHeight: "1.4", letterSpacing: "-0.1px", fontWeight: "500" }],
        "body-lg": ["17px", { lineHeight: "1.5", letterSpacing: "0" }],
        "body-md": ["15px", { lineHeight: "1.55", letterSpacing: "0" }],
        "body-tabular": ["14px", { lineHeight: "1.4", letterSpacing: "-0.2px" }],
        caption: ["13px", { lineHeight: "1.45", letterSpacing: "0" }],
        micro: ["11px", { lineHeight: "1.4", letterSpacing: "0" }],
        "micro-cap": ["11px", { lineHeight: "1.2", letterSpacing: "0.06em", fontWeight: "500" }],
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
        e1: "rgba(20,24,28,0.05) 0 1px 2px, rgba(20,24,28,0.04) 0 2px 8px",
        e2: "rgba(20,24,28,0.10) 0 10px 30px, rgba(20,24,28,0.05) 0 2px 8px",
        "proof-glow": "0 0 0 1px var(--accent-soft), 0 10px 34px rgba(109,74,255,0.20)",
      },
      maxWidth: {
        container: "1200px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 240ms ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
