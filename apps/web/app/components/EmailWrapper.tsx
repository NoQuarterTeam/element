import { Tailwind } from "@react-email/tailwind"
import { Html } from "@react-email/html"
import { Container } from "@react-email/container"
import { Head } from "@react-email/head"
import * as React from "react"
import colors from "tailwindcss/colors"

const theme = {
  extend: {
    spacing: {
      full: "100%",
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
}
export function EmailWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Html>
      <Head></Head>
      <Tailwind config={{ theme }}>
        <Container>{children}</Container>
      </Tailwind>
    </Html>
  )
}
