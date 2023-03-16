import * as React from "react"
import { Pressable, PressableProps, Text, View } from "react-native"

interface Props extends PressableProps {
  className?: string
  textClassName?: string
  children: React.ReactNode
}

export function Button(props: Props) {
  return (
    <Pressable onPress={props.onPress}>
      <View className="bg-primary-500 rounded-md p-2">
        <Text className="text-md text-center font-bold">{props.children}</Text>
      </View>
    </Pressable>
  )
}
