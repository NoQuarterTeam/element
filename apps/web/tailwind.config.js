/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  presets: [require("@element/tailwind-config")],
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
        nav: "72px",
        header: "124px",
        headerHabit: "143px",
        day: "100px",
      },
      fontSize: {
        xxxs: "0.4rem",
        xxs: "0.625rem",
      },
    },
    fontFamily: {
      heading: ["Poppins", "sans-serif"],
      body: ["Poppins", "sans-serif"],
      mono: ["SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
    },
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-radix")],
}
