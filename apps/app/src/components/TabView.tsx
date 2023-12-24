import type * as React from "react"
import { View } from "react-native"

import { Heading } from "./Heading"

interface Props {
  title: string
  children: React.ReactNode
}

export function TabView(props: Props) {
  return (
    <View className="px-4 pt-16">
      <View className="flex flex-row items-center space-x-2">
        <Heading className="text-3xl dark:text-white">{props.title}</Heading>
      </View>
      {props.children}
    </View>
  )
}
