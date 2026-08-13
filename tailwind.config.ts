import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── "The Launch Register" ──────────────────────────────
        // An editorial identity, not a dashboard one. Every competitor in this
        // space looks the same: white cards, blue or orange accent, drop
        // shadows everywhere. This looks like a printed register — paper stock,
        // hairline rules, one oxblood ink, serif headlines, monospaced figures.
        // Authority instead of enthusiasm.
        paper: {
          50: "#f6f4ef", // the page — uncoated stock
          100: "#fffdf9", // cards — warm white, never pure #fff
          200: "#edeae2", // wells / hover
          300: "#e2ded4", // rules with weight
          400: "#d3cec2", // dividers
          500: "#beb8a9", // muted edges
        },
        ink: {
          900: "#17150f", // headlines — warm near-black
          700: "#3a372e", // body copy
          500: "#6b6659", // secondary
          400: "#938d7e", // captions
        },
        // The one ink. Scarce on purpose, the way a second colour is scarce on
        // a printed page.
        oxblood: {
          400: "#a63a3a",
          500: "#8c2323",
          600: "#6e1a1a",
          700: "#4f1212",
        },
        // Functional only. Never decoration.
        brass: {
          400: "#c9a556", // #1 rank, Premium
          500: "#b08a3e",
          600: "#8a6a2c",
        },
        moss: {
          500: "#2f6b4f", // live / verified / slots open
          600: "#245740",
        },
      },
      fontFamily: {
        // Fraunces for headlines (optically-sized, opinionated serif),
        // Instrument Sans for reading, JetBrains Mono for every figure and
        // label. Nothing shared with Saasgrave's Bricolage, nothing shared
        // with the four competitors.
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["clamp(2.5rem, 5.6vw, 4.4rem)", { lineHeight: "0.98", letterSpacing: "-0.025em" }],
        masthead: ["clamp(1.8rem, 3.2vw, 2.6rem)", { lineHeight: "1.06", letterSpacing: "-0.02em" }],
        section: ["clamp(1.3rem, 1.9vw, 1.65rem)", { lineHeight: "1.16", letterSpacing: "-0.015em" }],
      },
      boxShadow: {
        // Paper doesn't float. Elevation is a rule plus a hair of shadow.
        page: "0 1px 0 rgba(23,21,15,0.05)",
        card: "0 1px 2px rgba(23,21,15,0.04), 0 10px 28px -22px rgba(23,21,15,0.22)",
        lift: "0 2px 6px rgba(23,21,15,0.06), 0 24px 48px -28px rgba(23,21,15,0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.16)" },
          "100%": { transform: "scale(1)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        pop: "pop 0.34s cubic-bezier(0.16, 1, 0.3, 1)",
        blink: "blink 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
