import { TextProps, Text as RText } from "react-native"
import { merge } from "../lib/tailwind"

export function Heading(props: TextProps) {
  return (
    <RText {...props} className={merge("font-heading", props.className)}>
      {props.children}
    </RText>
  )
}
