/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: "class",
  presets: [require("@element/tailwind-config")],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      fontSize: {
        xxxs: "6.4px",
        xxs: "10px",
      },
      fontFamily: {
        body: ["Poppins_400Regular"],
        label: ["Poppins_600SemiBold"],
        heading: ["Poppins_700Bold"],
        "extra-thick": ["Poppins_900Black"],
      },
    },
  },
}
