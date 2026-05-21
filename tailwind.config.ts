import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      colors: {
        e: { DEFAULT: "#7C3AED", light: "#EDE9FE", dark: "#4C1D95", mid: "#A78BFA" },
        i: { DEFAULT: "#059669", light: "#D1FAE5", dark: "#064E3B", mid: "#34D399" },
      },
    },
  },
  plugins: [],
} satisfies Config;
