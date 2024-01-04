import { View } from "react-native"
import { Link, useFocusEffect } from "expo-router"

import { Button } from "../../components/Button"
import { ModalView } from "../../components/ModalView"
import { Text } from "../../components/Text"
import { useOnboarding } from "../../lib/hooks/useOnboarding"

export default function Onboarding() {
  const setHasSeenOnboarding = useOnboarding((s) => s.setHasSeenOnboarding)

  useFocusEffect(() => {
    setHasSeenOnboarding()
  })
  return (
    <ModalView title="Welcome!">
      <View className="space-y-4">
        <Text className="text-lg">You are currently on a guest account.</Text>

        <Text className="text-lg">Log in to:</Text>
        <View className="flex flex-row items-start space-x-2">
          <Text className="text-xl">•</Text>
          <Text className="text-lg">Save tasks to your account and access them from any device</Text>
        </View>
        <View className="flex flex-row items-start space-x-2">
          <Text className="text-xl">•</Text>
          <Text className="text-lg">Manage tasks with custom elements</Text>
        </View>
        <View className="flex flex-row items-start space-x-2">
          <Text className="text-xl">•</Text>
          <Text className="text-lg">Build daily habits using our tracker.</Text>
        </View>
        <Link href="/login" asChild>
          <Button>Login</Button>
        </Link>

        <Link href="/" asChild>
          <Button variant="ghost">Continue as guest</Button>
        </Link>
      </View>
    </ModalView>
  )
}
