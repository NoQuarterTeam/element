import { TextProps, Text as RText } from "react-native"
import { merge } from "../lib/tailwind"

export function Text(props: TextProps) {
  return (
    <RText {...props} className={merge("font-body", props.className)}>
      {props.children}
    </RText>
  )
}
