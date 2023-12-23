import { Stack } from "expo-router"
import { useColorScheme } from "react-native"

export default function ProfileLayout() {
  const colorScheme = useColorScheme()
  return (
    <Stack
      screenOptions={{ contentStyle: { backgroundColor: colorScheme === "light" ? "white" : "black" }, headerShown: false }}
    />
  )
}
