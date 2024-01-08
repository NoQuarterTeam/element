import { Stack } from "expo-router"

import { useBackgroundColor } from "../../../lib/tailwind"

export default function HabitsLayout() {
  const backgroundColor = useBackgroundColor()
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor }, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="new" options={{ presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ presentation: "modal" }} />
    </Stack>
  )
}
