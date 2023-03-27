import { Link } from "expo-router"
import { View, useColorScheme } from "react-native"

import Feather from "@expo/vector-icons/Feather"
import * as React from "react"
import { Heading } from "./Heading"

interface Props {
  title: string
  children: React.ReactNode
}

export function ScreenView(props: Props) {
  const colorScheme = useColorScheme()
  return (
    <View className="px-4 pt-16">
      <View className="flex flex-row items-center space-x-2">
        <Link href="../" className="mb-1 p-2" asChild>
          <Feather name="chevron-left" size={24} color={colorScheme === "dark" ? "white" : "black"} />
        </Link>
        <Heading className="text-3xl dark:text-white">{props.title}</Heading>
      </View>
      {props.children}
    </View>
  )
}
