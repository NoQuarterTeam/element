import { Link } from "expo-router"
import { View, Text } from "react-native"
import { StatusBar } from "expo-status-bar"
import Feather from "@expo/vector-icons/Feather"
import * as React from "react"

interface Props {
  title: string
  children: React.ReactNode
}

export function Modal(props: Props) {
  return (
    <View className="px-4 pt-6">
      <View className="flex flex-row justify-between">
        <Text className="text-3xl font-extrabold">{props.title}</Text>

        <Link href="/" className="p-2" asChild>
          <Feather name="x" size={24} />
        </Link>
      </View>
      {props.children}
      <StatusBar style="light" />
    </View>
  )
}
