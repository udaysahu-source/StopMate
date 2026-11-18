import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#EEF1F5",
        card: "#FFFFFF",
        ink: "#111827",
        sub: "#566072",
        line: "#E3E7ED",
        soft: "#F5F7FA",
        yellow: {
          DEFAULT: "#FFC400",
          hover: "#E6AE00",
        },
        blue: {
          DEFAULT: "#2563EB",
          light: "#E8EFFE",
        },
        green: {
          DEFAULT: "#12803D",
          light: "#E4F5EA",
        },
        orange: {
          DEFAULT: "#B8430A",
          light: "#FFEADB",
        },
        red: {
          DEFAULT: "#C62828",
          light: "#FFF1F1",
        },
      },
      borderRadius: {
        card: "28px",
        sheet: "24px",
        btn: "20px",
      },
      fontFamily: {
        sans: ["var(--font-figtree)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        phone: "0 10px 30px rgba(17,24,39,0.10), 0 1px 2px rgba(17,24,39,0.08)",
        pill: "0 2px 8px rgba(17,24,39,0.15)",
        tab: "0 1px 3px rgba(17,24,39,0.15)",
      },
      keyframes: {
        halo: {
          "0%": { transform: "scale(0.6)", opacity: "0.55" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
      },
      animation: {
        halo: "halo 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
