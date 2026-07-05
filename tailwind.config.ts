import type { Config } from "tailwindcss";

/**
 * "Sakura Dawn Epic" palette
 * Dusk indigo -> violet -> rose -> ember orange, pink sakura, gold god-rays.
 * Overrides the skill's default light sky-blue palette to match the
 * dark, cinematic, warm anime mood the user selected.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dusk: {
          950: "#0d0618",
          900: "#160a2b",
          800: "#241042",
          700: "#3b1d5e",
          600: "#5a2a7d",
        },
        rose: {
          glow: "#ff5fa2",
          400: "#ff8fb8",
          300: "#ffb7d5",
          200: "#ffd6e6",
        },
        ember: {
          600: "#e8663a",
          500: "#f5834a",
          400: "#ffa25e",
          gold: "#ffcf8b",
        },
        haze: "#fff6fb",
      },
      fontFamily: {
        display: ["var(--font-righteous)", "system-ui", "sans-serif"],
        body: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-rose": "0 0 20px rgba(255,95,162,0.55), 0 0 48px rgba(255,95,162,0.35)",
        "glow-gold": "0 0 20px rgba(255,207,139,0.6), 0 0 60px rgba(245,131,74,0.4)",
        "glow-soft": "0 0 40px rgba(255,143,184,0.25)",
      },
      dropShadow: {
        "text-glow": [
          "0 0 12px rgba(255,143,184,0.65)",
          "0 0 30px rgba(255,95,162,0.45)",
        ],
        "gold-glow": [
          "0 0 14px rgba(255,207,139,0.7)",
          "0 0 34px rgba(245,131,74,0.5)",
        ],
      },
      keyframes: {
        "gradient-drift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "god-rays": {
          "0%, 100%": { opacity: "0.35", transform: "translateX(-2%) rotate(0.5deg)" },
          "50%": { opacity: "0.6", transform: "translateX(2%) rotate(-0.5deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-glow": {
          "0%, 100%": { filter: "brightness(1)", opacity: "0.9" },
          "50%": { filter: "brightness(1.35)", opacity: "1" },
        },
        "dwell-ring": {
          from: { strokeDashoffset: "289" },
          to: { strokeDashoffset: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "gradient-drift": "gradient-drift 18s ease-in-out infinite",
        "god-rays": "god-rays 9s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
