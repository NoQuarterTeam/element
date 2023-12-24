import type * as React from "react"
import { TouchableOpacity, useColorScheme, View } from "react-native"
import Feather from "@expo/vector-icons/Feather"
import { Link, useRouter } from "expo-router"

import { Heading } from "./Heading"

interface Props {
  title: string
  children: React.ReactNode
}

export function ScreenView(props: Props) {
  const colorScheme = useColorScheme()
  const router = useRouter()
  const canGoBack = router.canGoBack()
  return (
    <View className="px-4 pt-16">
      <View className="flex flex-row items-center space-x-2">
        {canGoBack ? (
          <Link href="../" className="mb-1 p-2" asChild>
            <Feather name="chevron-left" size={24} color={colorScheme === "dark" ? "white" : "black"} />
          </Link>
        ) : (
          <TouchableOpacity onPress={() => router.replace("/")} className="mb-1 p-2">
            <Feather name="chevron-left" size={24} color={colorScheme === "dark" ? "white" : "black"} />
          </TouchableOpacity>
        )}

        <Heading className="text-3xl dark:text-white">{props.title}</Heading>
      </View>
      {props.children}
    </View>
  )
}
