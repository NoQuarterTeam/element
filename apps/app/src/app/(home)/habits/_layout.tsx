import { Stack } from "expo-router"
import { useColorScheme } from "react-native"

export default function HabitsLayout() {
  const colorScheme = useColorScheme()
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colorScheme === "light" ? "white" : "black" }, headerShown: false }}>
      <Stack.Screen name="index" options={{ presentation: "modal" }} />
      <Stack.Screen name="new" options={{ presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ presentation: "modal" }} />
    </Stack>
  )
}
