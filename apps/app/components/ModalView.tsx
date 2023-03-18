import { useRouter } from "expo-router"
import { View, Text, TouchableOpacity } from "react-native"
import { StatusBar } from "expo-status-bar"
import Feather from "@expo/vector-icons/Feather"
import * as React from "react"

interface Props {
  title?: string
  onBack?: () => void
  children: React.ReactNode
}

export function ModalView(props: Props) {
  const router = useRouter()
  return (
    <View className="px-4 pt-6">
      <View className="flex flex-row justify-between">
        {props.title ? <Text className="text-3xl font-extrabold">{props.title}</Text> : <Text />}

        <TouchableOpacity onPress={props.onBack ? props.onBack : router.back} className="p-2">
          <Feather name="x" size={24} />
        </TouchableOpacity>
      </View>
      {props.children}
      <StatusBar style="light" />
    </View>
  )
}
