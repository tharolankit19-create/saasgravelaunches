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
        // ── "The Launch Register", warmed ──────────────────────
        // Editorial bones — paper stock, hairline rules, serif headlines,
        // monospaced figures — carrying Saasgrave's confident orange as the one
        // ink, so the two products read as family. Authority, but not cold.
        paper: {
          50: "#fdfdfe", // the page — very nearly white
          100: "#ffffff", // cards — pure white
          200: "#f7f8fa", // wells / hover
          300: "#edeff3", // rules with weight
          400: "#e2e5ea", // dividers
          500: "#c8ccd4", // muted edges
        },
        ink: {
          900: "#16181d", // headlines — cool near-black
          700: "#393c44", // body copy
          500: "#666b74", // secondary
          400: "#9aa0aa", // captions
        },
        // The one ink — Saasgrave's orange. Scarce on purpose.
        ember: {
          400: "#ffb184", // light / soft fills / gradient top
          500: "#f9793a", // primary — buttons, marks, links (lightened)
          600: "#c2410c", // accessible orange text on paper
          700: "#a83c0a", // deep, for pressed / rules
        },
        // Functional only. Never decoration.
        brass: {
          400: "#d8ad55", // #1 rank, Premium
          500: "#bf9235",
          600: "#94701f",
        },
        moss: {
          500: "#2f7a4f", // live / verified / slots open
          600: "#245f3d",
        },
      },
      fontFamily: {
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
        // Warm, layered elevation — soft ambient + a tight contact shadow, tuned
        // brown rather than grey so cards sit on paper instead of floating on a
        // screen. This is the difference between "designed" and "flat".
        page: "0 1px 0 rgba(17,18,22,0.025)",
        card: "0 1px 2px rgba(18,20,26,0.03), 0 4px 10px -4px rgba(18,20,26,0.045), 0 16px 34px -18px rgba(18,20,26,0.10)",
        lift: "0 2px 6px rgba(18,20,26,0.045), 0 10px 22px -8px rgba(18,20,26,0.07), 0 34px 64px -26px rgba(18,20,26,0.16)",
        // Orange CTA glow — used only on the primary launch action.
        glow: "0 1px 2px rgba(168,60,10,0.16), 0 8px 20px -6px rgba(249,121,58,0.36)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.6)",
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
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)", opacity: "0.7" },
          "50%": { transform: "translate3d(2%,-3%,0) scale(1.1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        pop: "pop 0.34s cubic-bezier(0.16, 1, 0.3, 1)",
        blink: "blink 2s ease-in-out infinite",
        aurora: "aurora 16s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
