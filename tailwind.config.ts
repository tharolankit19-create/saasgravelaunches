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
        // Saasgrave Launches — same family as Saasgrave (paper canvas, ink
        // type, one confident accent), deliberately re-tuned so the two read
        // as siblings rather than the same site twice. The canvas cools a
        // shade, the accent moves from Saasgrave's ember orange to an electric
        // violet, and a signal green carries "live this week".
        paper: {
          50: "#f8f7f4", // page — cool paper
          100: "#ffffff", // cards / surfaces
          200: "#f1efe9", // hover / wells
          300: "#e8e5dd", // deeper well
          400: "#ddd9cf", // subtle fills
          500: "#cec9bc", // dividers with weight
        },
        ink: {
          900: "#12110f", // headings — near-black
          700: "#3b372f", // body
          500: "#6a655a", // secondary
          400: "#948e80", // muted
        },
        // The one primary. Violet reads "launch / new", warm paper keeps it
        // in the Saasgrave family instead of turning into a generic SaaS blue.
        violet: {
          400: "#8B6BFF",
          500: "#5B3DF5", // primary — buttons, marks, links
          600: "#4527CC", // accessible violet text on paper
        },
        // Live / verified / positive. Only used for state, never decoration.
        signal: {
          400: "#22B573",
          500: "#0FA968",
          600: "#0A7F4E",
        },
        // Ranking medals + Premium. Gold is scarce on purpose.
        medal: {
          400: "#EFBE63",
          500: "#E0A33B",
          600: "#A9741B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,17,15,0.04), 0 8px 20px -14px rgba(18,17,15,0.14)",
        lift: "0 2px 10px rgba(18,17,15,0.06), 0 24px 56px -26px rgba(18,17,15,0.22)",
        glow: "0 8px 24px -10px rgba(91,61,245,0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulse_ring: {
          "0%": { boxShadow: "0 0 0 0 rgba(15,169,104,0.45)" },
          "70%": { boxShadow: "0 0 0 8px rgba(15,169,104,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(15,169,104,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        pop: "pop 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        marquee: "marquee var(--marquee-dur, 38s) linear infinite",
        "pulse-ring": "pulse_ring 2.2s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
