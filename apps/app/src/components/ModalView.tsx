import type * as React from "react"
import { Text, TouchableOpacity, useColorScheme, View } from "react-native"
import Feather from "@expo/vector-icons/Feather"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"

import { Heading } from "./Heading"

interface Props {
  title?: string
  onBack?: () => void
  children: React.ReactNode
}

export function ModalView(props: Props) {
  const router = useRouter()
  const colorScheme = useColorScheme()
  return (
    <View className="h-full bg-white px-4 pt-6 dark:bg-black">
      <View className="flex flex-row justify-between">
        {props.title ? <Heading className="text-3xl">{props.title}</Heading> : <Text />}

        <TouchableOpacity onPress={props.onBack ? props.onBack : router.back} className="p-2">
          <Feather name="x" size={24} color={colorScheme === "dark" ? "white" : "black"} />
        </TouchableOpacity>
      </View>
      {props.children}
      <StatusBar style="light" />
    </View>
  )
}
