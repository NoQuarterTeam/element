import { Heading as RHeading } from "@react-email/components"
import type * as React from "react"

import { merge } from "@element/shared"

interface Props {
  children: React.ReactNode
  className?: string
}

export function Heading(props: Props) {
  return (
    <RHeading as="h1" className={merge("text-primary text-2xl font-bold italic", props.className)}>
      {props.children}
    </RHeading>
  )
}
