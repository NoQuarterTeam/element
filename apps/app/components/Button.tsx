import * as React from "react"
import { Pressable, PressableProps, View } from "react-native"
import { Text } from "./Text"

interface Props extends PressableProps {
  className?: string
  textClassName?: string
  children: React.ReactNode
}

export function Button(props: Props) {
  return (
    <Pressable onPress={props.onPress}>
      <View className="bg-primary-600 rounded-sm px-4 py-3">
        <Text className="font-heading text-center text-lg text-white">{props.children}</Text>
      </View>
    </Pressable>
  )
}
