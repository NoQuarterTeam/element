import { TextInput, TextInputProps, useColorScheme } from "react-native"
import { merge } from "@element/shared"
import { styled } from "nativewind"

export interface InputProps extends TextInputProps {}

const StyledInput = styled(TextInput)

export function Input(props: TextInputProps) {
  const colorScheme = useColorScheme()
  return (
    <StyledInput
      placeholderTextColor={colorScheme === "dark" ? "#444" : "#ccc"}
      {...props}
      className={merge(
        "border border-gray-100 dark:border-gray-600",
        "font-body text-md focus:border-primary-500 rounded-xs block w-full px-3.5 py-2.5 text-black dark:text-white",
        props.className,
      )}
    />
  )
}
