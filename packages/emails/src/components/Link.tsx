import { Link as RLink } from "@react-email/components"

import { merge } from "@element/shared"

interface Props {
  href: string
  children: string
  className?: string
}

export function Link(props: Props) {
  return (
    <RLink href={props.href} className={merge("block text-orange-500 underline", props.className)}>
      {props.children}
    </RLink>
  )
}
