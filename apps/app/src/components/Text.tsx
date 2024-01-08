import { Text as RText, type TextProps } from "react-native"

import { merge } from "@element/shared"

export function Text(props: TextProps) {
  return (
    <RText {...props} className={merge("font-body text-base text-black dark:text-white", props.className)}>
      {props.children}
    </RText>
  )
}
