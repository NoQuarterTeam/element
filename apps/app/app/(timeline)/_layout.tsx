import { Stack } from "expo-router"

import { AuthProvider } from "../../components/AuthProvider"

// Timeline layout
export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ contentStyle: { backgroundColor: "white" }, headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="new" options={{ presentation: "modal" }} />
        <Stack.Screen name="[id]" options={{ presentation: "modal" }} />
      </Stack>
    </AuthProvider>
  )
}
