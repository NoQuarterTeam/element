import { Link } from "expo-router"
import { View } from "react-native"

import Feather from "@expo/vector-icons/Feather"
import * as React from "react"
import { Heading } from "./Heading"

interface Props {
  title: string
  children: React.ReactNode
}

export function ScreenView(props: Props) {
  return (
    <View className="px-4 pt-16">
      <View className="flex flex-row items-center space-x-2">
        <Link href="../" className="mb-1 p-2" asChild>
          <Feather name="chevron-left" size={24} />
        </Link>
        <Heading className="text-3xl">{props.title}</Heading>
      </View>
      {props.children}
    </View>
  )
}
