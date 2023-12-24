import { Button as RButton } from "@react-email/components"

import { merge } from "@element/shared"

interface Props {
  href: string
  children: string
  className?: string
}

export function Button(props: Props) {
  return (
    <RButton
      href={props.href}
      className={merge("rounded-xs border border-solid border-gray-700 bg-black px-3 py-3 text-white", props.className)}
      color="#fff"
    >
      <span className="text-white">{props.children}</span>
    </RButton>
  )
}
