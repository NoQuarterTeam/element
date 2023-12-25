import type * as React from "react"
import { Text, TouchableOpacity, useColorScheme, View } from "react-native"
import Feather from "@expo/vector-icons/Feather"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"

import { Heading } from "./Heading"
import { join } from "@element/shared"

interface Props {
  title?: string
  onBack?: () => void
  children: React.ReactNode
}

export function ModalView(props: Props) {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const canGoBack = router.canGoBack()
  return (
    <View className={join("h-full bg-white px-4 dark:bg-black", canGoBack ? "pt-6" : "pt-16")}>
      <View className="flex flex-row justify-between">
        {props.title ? <Heading className="text-3xl">{props.title}</Heading> : <Text />}

        <TouchableOpacity
          onPress={props.onBack ? props.onBack : canGoBack ? router.back : () => router.replace("/")}
          className="p-2"
        >
          <Feather name="x" size={24} color={colorScheme === "dark" ? "white" : "black"} />
        </TouchableOpacity>
      </View>
      {props.children}
      <StatusBar style="light" />
    </View>
  )
}
