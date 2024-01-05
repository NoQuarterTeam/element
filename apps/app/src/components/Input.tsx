import * as React from "react"
import { TextInput, type TextInputProps, useColorScheme } from "react-native"
import { styled } from "nativewind"

import { merge } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

export interface InputProps extends TextInputProps {}

const StyledInput = styled(TextInput)

export const inputClassName =
  "border border-gray-100 dark:border-gray-600 font-body focus:border-primary-500 rounded-xs block w-full px-3.5 py-2.5 text-black dark:text-white"

export const Input = React.forwardRef<TextInput, TextInputProps>(function _Input(props, ref) {
  const colorScheme = useColorScheme()
  return (
    <StyledInput
      ref={ref}
      placeholderTextColor={colorScheme === "dark" ? colors.gray[600] : colors.gray[400]}
      {...props}
      className={merge(inputClassName, props.className)}
    />
  )
})
