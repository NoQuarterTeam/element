const colors = require("./colors")
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
const config = {
  theme: {
    extend: {
      spacing: {
        full: "100%",
      },
      borderRadius: {
        xs: "2px",
      },
      colors: {
        primary: colors.primary,
        gray: colors.gray,
      },
    },
  },
  plugins: [shapes],
}

module.exports = config
