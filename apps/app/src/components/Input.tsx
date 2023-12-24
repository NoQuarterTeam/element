import { TextInput, type TextInputProps, useColorScheme } from "react-native"
import { styled } from "nativewind"

import { merge } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

export interface InputProps extends TextInputProps {}

const StyledInput = styled(TextInput)

export function Input(props: TextInputProps) {
  const colorScheme = useColorScheme()
  return (
    <StyledInput
      placeholderTextColor={colorScheme === "dark" ? colors.gray[600] : colors.gray[400]}
      {...props}
      className={merge(
        "border border-gray-100 dark:border-gray-600",
        "font-body text-md focus:border-primary-500 rounded-xs block w-full px-3.5 py-2.5 text-black dark:text-white",
        props.className,
      )}
    />
  )
}
