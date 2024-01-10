import { Stack } from "expo-router"

import { useBackgroundColor } from "../../../../../lib/tailwind"

export default function ElementsLayout() {
  const backgroundColor = useBackgroundColor()
  return (
    <Stack initialRouteName="index" screenOptions={{ contentStyle: { backgroundColor }, headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Screen name="move" options={{ presentation: "modal" }} />
    </Stack>
  )
}
