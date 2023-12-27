import type * as React from "react"
import { TouchableOpacity, View } from "react-native"

import { Link, useRouter } from "expo-router"

import { Heading } from "./Heading"
import { Icon } from "./Icon"
import { ChevronLeft } from "lucide-react-native"

interface Props {
  title: string
  children: React.ReactNode
}

export function ScreenView(props: Props) {
  const router = useRouter()
  const canGoBack = router.canGoBack()
  return (
    <View className="px-4 pt-16">
      <View className="flex flex-row items-center space-x-2">
        {canGoBack ? (
          <Link href="../" className="mb-1 p-2" asChild>
            <Icon icon={ChevronLeft} size={24} />
          </Link>
        ) : (
          <TouchableOpacity onPress={() => router.replace("/")} className="mb-1 p-2">
            <Icon icon={ChevronLeft} size={24} />
          </TouchableOpacity>
        )}

        <Heading className="text-3xl dark:text-white">{props.title}</Heading>
      </View>
      {props.children}
    </View>
  )
}
