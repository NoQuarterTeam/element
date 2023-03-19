import { Stack } from "expo-router"
import { useColorScheme } from "react-native"

import { AuthProvider } from "../../components/AuthProvider"

// Timeline layout
export default function RootLayout() {
  const colorScheme = useColorScheme()
  return (
    <AuthProvider>
      <Stack
        screenOptions={{ contentStyle: { backgroundColor: colorScheme === "light" ? "white" : "black" }, headerShown: false }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="new" options={{ presentation: "modal" }} />
        <Stack.Screen name="[id]" options={{ presentation: "modal" }} />
      </Stack>
    </AuthProvider>
  )
}
