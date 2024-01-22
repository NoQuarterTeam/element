import type * as React from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { X } from "lucide-react-native"

import { join } from "@element/shared"

import { Heading } from "./Heading"
import { Icon } from "./Icon"
import { Toast } from "./Toast"

interface Props {
  title?: string
  onBack?: () => void
  children?: React.ReactNode
  containerClassName?: string
}

export function ModalView(props: Props) {
  const router = useRouter()

  const canGoBack = router.canGoBack()
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView className={join("flex-1 bg-white px-4 pt-4 dark:bg-black", props.containerClassName)}>
        <View className="flex flex-row justify-between">
          {props.title ? <Heading className="text-2xl">{props.title}</Heading> : <Text />}

          <TouchableOpacity
            onPress={props.onBack ? props.onBack : canGoBack ? router.back : () => router.navigate("/")}
            className="p-2"
          >
            <Icon icon={X} size={24} />
          </TouchableOpacity>
        </View>
        {props.children}
        <StatusBar style="light" />
        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
