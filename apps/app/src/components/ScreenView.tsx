import type * as React from "react"
import { TouchableOpacity, View } from "react-native"
import { useRouter } from "expo-router"
import { ChevronLeft } from "lucide-react-native"

import { Heading } from "./Heading"
import { Icon } from "./Icon"

interface Props {
  title: string
  children?: React.ReactNode
}

export function ScreenView(props: Props) {
  const router = useRouter()
  const canGoBack = router.canGoBack()
  return (
    <View className="px-4 pt-16">
      <View className="flex flex-row items-center">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={canGoBack ? () => router.push("../") : () => router.replace("/")}
          className="mb-1 p-2"
        >
          <Icon icon={ChevronLeft} size={24} />
        </TouchableOpacity>

        <Heading className="text-3xl dark:text-white">{props.title}</Heading>
      </View>
      {props.children}
    </View>
  )
}
