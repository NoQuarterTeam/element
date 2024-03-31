import { Body, Html, Preview } from "@react-email/components"
import type * as React from "react"

export function EmailDocument({ children, preview }: { children: React.ReactNode; preview?: string }) {
  return (
    <Html lang="en" dir="ltr" style={{ backgroundColor: "white" }}>
      {preview && <Preview>{preview}</Preview>}
      <Body style={{ fontFamily: "Verdana, sans-serif", fontWeight: 400 }}>{children}</Body>
    </Html>
  )
}
