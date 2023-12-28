import { View } from "react-native"

import { merge } from "@element/shared"

import { Input, type InputProps } from "./Input"
import { Text } from "./Text"

interface Props extends InputProps {
  label?: string
  error?: string[]
  rightElement?: React.ReactNode
  input?: React.ReactNode
}

export function FormInput({ label, error, rightElement, input, ...props }: Props) {
  return (
    <View className="space-y-0.5">
      {label && <FormInputLabel label={label} />}
      <View className="flex flex-row items-center space-x-2">
        {input || <Input {...props} className={merge(rightElement && "flex-1")} />}
        <View>{rightElement}</View>
      </View>
      {error?.map((error) => <FormInputError key={error} error={error} />)}
    </View>
  )
}

export function FormInputLabel({ label }: { label: string }) {
  return <Text className="font-body">{label}</Text>
}

export function FormInputError({ error }: { error: string }) {
  return <Text className="text-red-500">{error}</Text>
}
