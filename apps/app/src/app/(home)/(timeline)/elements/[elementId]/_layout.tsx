import { Stack } from "expo-router"

import { useBackgroundColor } from "~/lib/tailwind"

export default function ElementsLayout() {
  const backgroundColor = useBackgroundColor()
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{ contentStyle: { backgroundColor }, headerShown: false, presentation: "modal" }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="move" />
    </Stack>
  )
}
