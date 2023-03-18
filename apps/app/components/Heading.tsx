import { TextProps, Text as RText } from "react-native"
import { merge } from "@element/shared"

export function Heading(props: TextProps) {
  return (
    <RText {...props} className={merge("font-heading", props.className)}>
      {props.children}
    </RText>
  )
}
