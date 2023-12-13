import type * as React from "react"
import colors from "@element/tailwind-config/src/colors"
import { Container } from "@react-email/container"
import { Head } from "@react-email/head"
import { Html } from "@react-email/html"
import { Tailwind } from "@react-email/tailwind"

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
      primary: colors.primary,
      gray: colors.gray,
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
