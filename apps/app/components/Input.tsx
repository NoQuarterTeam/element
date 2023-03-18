import { TextInput, TextInputProps } from "react-native"
import { merge } from "@element/shared"
import { styled } from "nativewind"

export interface InputProps extends TextInputProps {}

const StyledInput = styled(TextInput)

export function Input(props: TextInputProps) {
  return (
    <StyledInput
      placeholderTextColor="#666"
      {...props}
      className={merge(
        "border border-gray-100",
        "font-body text-md focus:border-primary-500 rounded-xs block w-full px-3.5 py-2.5 text-black",
        props.className,
      )}
    />
  )
}
