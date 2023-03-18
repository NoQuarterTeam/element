import { View } from "react-native"
import { merge } from "@element/shared"
import { Input, InputProps } from "./Input"
import { Text } from "./Text"

interface Props extends InputProps {
  label?: string
  error?: string
  rightElement?: React.ReactNode
}

export function FormInput({ label, error, rightElement, ...props }: Props) {
  return (
    <View className="space-y-0.5">
      {label && <FormLabel label={label} />}
      <View className="flex flex-row items-center space-x-2">
        <Input {...props} className={merge(rightElement && "flex-1")} />
        <View>{rightElement}</View>
      </View>
      {error && <FormError error={error} />}
    </View>
  )
}

export function FormLabel({ label }: { label: string }) {
  return <Text className="font-label">{label}</Text>
}

export function FormError({ error }: { error: string }) {
  return <Text className="text-red-500">{error}</Text>
}
