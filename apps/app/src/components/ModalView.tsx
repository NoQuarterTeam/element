import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import type * as React from "react"
import { Text, TouchableOpacity, View } from "react-native"

import { join } from "@element/shared"
import { X } from "lucide-react-native"
import { Heading } from "./Heading"
import { Icon } from "./Icon"

interface Props {
  title?: string
  onBack?: () => void
  children?: React.ReactNode
}

export function ModalView(props: Props) {
  const router = useRouter()

  const canGoBack = router.canGoBack()
  return (
    <View className={join("h-full bg-white px-4 dark:bg-black", props.onBack || canGoBack ? "pt-6" : "pt-16")}>
      <View className="flex flex-row justify-between">
        {props.title ? <Heading className="text-3xl">{props.title}</Heading> : <Text />}

        <TouchableOpacity
          onPress={props.onBack ? props.onBack : canGoBack ? router.back : () => router.replace("/")}
          className="p-2"
        >
          <Icon icon={X} size={24} />
        </TouchableOpacity>
      </View>
      {props.children}
      <StatusBar style="light" />
    </View>
  )
}
