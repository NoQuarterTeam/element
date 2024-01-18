import type { Config } from "tailwindcss"

const config = {
  darkMode: "class",
  presets: [require("@element/tailwind-config")],
  content: ["./app/**/*.{ts,tsx}", "../../packages/shared/**/*.{ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        nav: "72px",
        header: "124px",
        headerHabit: "143px",
        day: "100px",
      },
      fontSize: {
        xxxs: "0.4rem",
        xxs: "0.625rem",
      },
      animation: {
        "pulse-fast": "pulse 0.5s linear infinite",
      },
      colors: {
        background: "var(--background)",
        "background-light": "var(--background-light)",
        "background-dark": "var(--background-dark)",
        border: "var(--border)",
      },
      fontFamily: {
        serif: ["Poppins", "sans-serif"],
        sans: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("tailwindcss-radix"),
    require("tailwind-scrollbar-hide"),
    require("@tailwindcss/container-queries"),
  ],
} satisfies Config

export default config
