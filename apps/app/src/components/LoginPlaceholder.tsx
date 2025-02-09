import { useRouter } from "expo-router"
import type * as React from "react"
import { ScrollView, View } from "react-native"

import { Button } from "./Button"
import { Text } from "./Text"

interface Props {
  text: string
  children?: React.ReactNode
}

export function LoginPlaceholder(props: Props) {
  const router = useRouter()
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View className="gap-4">
        <View className="gap-6">
          <Text className="text-lg">{props.text}</Text>
          <View>
            <Button onPress={() => router.push("/login")}>Login</Button>
          </View>
        </View>
        <View>{props.children}</View>
      </View>
    </ScrollView>
  )
}
