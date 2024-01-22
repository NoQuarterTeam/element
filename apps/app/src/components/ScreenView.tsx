import type * as React from "react"
import { TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
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
    <SafeAreaView className="flex-1 px-4 pt-2">
      <View className="flex flex-row items-center">
        <TouchableOpacity activeOpacity={0.7} onPress={canGoBack ? router.back : () => router.navigate("/")} className="p-2">
          <Icon icon={ChevronLeft} size={24} />
        </TouchableOpacity>

        <Heading className="text-2xl dark:text-white">{props.title}</Heading>
      </View>
      {props.children}
    </SafeAreaView>
  )
}
