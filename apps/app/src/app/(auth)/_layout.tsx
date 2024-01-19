import { Stack } from "expo-router"

import { useBackgroundColor } from "~/lib/tailwind"

export default function AuthLayout() {
  const backgroundColor = useBackgroundColor()
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor }, headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}
