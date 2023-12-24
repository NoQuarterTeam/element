import { type Config } from "tailwindcss"

import colors from "@element/tailwind-config/src/colors"

export const theme = {
  extend: {
    spacing: {
      full: "100%",
    },
    borderRadius: {
      xs: "3px",
    },
    fontSize: {
      xxxs: "0.4rem",
      xxs: "0.625rem",
    },
    fontFamily: {
      sans: ["Urbanist", "sans-serif"],
      serif: ["Urbanist", "sans-serif"],
    },
    colors: {
      primary: colors.primary,
      gray: colors.gray,
      background: "#241c17",
    },
  },
} satisfies Config["theme"]
