const colors = require("tailwindcss/colors")
const plugin = require("tailwindcss/plugin")

const shapes = plugin(function ({ matchUtilities, theme }) {
  matchUtilities(
    {
      sq: (value) => ({
        width: value,
        height: value,
      }),
      circle: (value) => ({
        width: value,
        height: value,
        borderRadius: "9999px",
      }),
    },
    { values: theme("spacing") },
  )
})

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/pages/**/*.{js,ts,jsx,tsx}",
    "!./app/pages/emails+/**/*",
    "./app/root.tsx",
    "./app/components/**/*.{js,ts,jsx,tsx}",
    "./app/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        full: "100%",
        nav: "72px",
        header: "124px",
        headerHabit: "143px",
        day: "100px",
      },
      borderRadius: {
        xs: "2px",
      },
      fontSize: {
        xxxs: "0.4rem",
        xxs: "0.625rem",
      },
      colors: {
        primary: colors.orange,
        gray: {
          50: "#FAFAFA",
          75: "#EFEFEF",
          100: "#D9DADC",
          200: "#B5B7BA",
          300: "#919598",
          400: "#4A4F52",
          500: "#6D7275",
          600: "#373C3F",
          700: "#24282A",
          800: "#121516",
          900: "#010101",
        },
      },
    },
    fontFamily: {
      heading: ["Poppins", "sans-serif"],
      body: ["Poppins", "sans-serif"],
      mono: ["SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/line-clamp"), require("tailwindcss-radix"), shapes],
}
