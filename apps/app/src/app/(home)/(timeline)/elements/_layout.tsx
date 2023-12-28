import { Stack } from "expo-router"

import { useBackgroundColor } from "../../../../lib/tailwind"

export default function ElementsLayout() {
  const backgroundColor = useBackgroundColor()
  return (
    <Stack initialRouteName="index" screenOptions={{ contentStyle: { backgroundColor }, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new-element" options={{ presentation: "modal" }} />
      <Stack.Screen name="[elementId]" options={{ presentation: "modal" }} />
    </Stack>
  )
}
