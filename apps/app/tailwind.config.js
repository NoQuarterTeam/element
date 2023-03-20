/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: "class",
  presets: [require("@element/tailwind-config")],
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      body: ["Poppins_400Regular"],
      label: ["Poppins_600SemiBold"],
      heading: ["Poppins_700Bold"],
      "extra-thick": ["Poppins_900Black"],
    },
  },
}
