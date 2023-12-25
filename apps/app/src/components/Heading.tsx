import { type TextProps } from "react-native"

import { merge } from "@element/shared"

import { Text } from "./Text"

export function Heading(props: TextProps) {
  return (
    <Text {...props} className={merge("font-heading pt-0.5", props.className)}>
      {props.children}
    </Text>
  )
}
