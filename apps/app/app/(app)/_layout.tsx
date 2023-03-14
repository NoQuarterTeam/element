import { Stack } from "expo-router"

import { AuthProvider } from "../../components/AuthProvider"

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ contentStyle: { backgroundColor: "white" }, headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="new" options={{ presentation: "modal" }} />
      </Stack>
    </AuthProvider>
  )
}
