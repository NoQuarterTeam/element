import { TouchableOpacity, View } from "react-native"
import { merge } from "../lib/tailwind"
import { Input, InputProps } from "./Input"
import { Text } from "./Text"

interface Props extends InputProps {
  label?: string
  error?: string
  rightAction?: {
    icon: React.ReactNode
    onPress: () => void
  }
}

export function FormInput({ label, error, rightAction, ...props }: Props) {
  return (
    <View className="space-y-0.5">
      {label && <FormLabel label={label} />}
      <View className="flex flex-row items-center space-x-2">
        <Input {...props} className={merge(rightAction && "flex-1")} />
        {rightAction ? (
          <TouchableOpacity onPress={rightAction.onPress} className="border border-gray-100 p-2.5">
            {rightAction.icon}
          </TouchableOpacity>
        ) : null}
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
