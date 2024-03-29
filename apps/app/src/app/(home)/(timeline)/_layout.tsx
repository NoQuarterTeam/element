import { Stack } from "expo-router"

import { useBackgroundColor } from "~/lib/tailwind"

export default function TimelineLayout() {
  const backgroundColor = useBackgroundColor()
  return (
    <Stack initialRouteName="index" screenOptions={{ contentStyle: { backgroundColor }, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="backlog" options={{ presentation: "modal" }} />
      <Stack.Screen name="elements" options={{ presentation: "modal" }} />
      <Stack.Screen name="new" options={{ presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="repeat-select" options={{ presentation: "modal" }} />
    </Stack>
  )
}
