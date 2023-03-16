import * as React from "react"

import { TextInput, TextInputProps } from "react-native"
import { merge } from "../lib/tailwind"
import { styled } from "nativewind"

export interface InputProps extends TextInputProps {}
const StyledInput = styled(TextInput)

export const Input = (props: TextInputProps) => {
  return (
    <StyledInput
      placeholderTextColor="#666"
      {...props}
      className={merge(
        "border border-black/10",
        "text-md focus:border-primary-500 rounded-xs block w-full px-4 py-2 text-black",
        props.className,
      )}
    />
  )
}
