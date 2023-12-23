import { Stack } from "expo-router"
import { useColorScheme } from "react-native"

export default function TimelineLayout() {
  const colorScheme = useColorScheme()
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colorScheme === "light" ? "white" : "black" }, headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ presentation: "modal" }} />
    </Stack>
  )
}
