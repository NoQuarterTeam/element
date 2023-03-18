import { TextProps, Text as RText } from "react-native"
import { merge } from "@element/shared"

export function Text(props: TextProps) {
  return (
    <RText {...props} className={merge("font-body", props.className)}>
      {props.children}
    </RText>
  )
}
