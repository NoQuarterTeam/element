import { Slot, Stack } from "expo-router"
import { View } from "react-native"

import { AuthProvider } from "../../components/AuthProvider"

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  return (
    <AuthProvider>
      <View className="flex-1 bg-white pt-16">
        <Stack screenOptions={{ contentStyle: { backgroundColor: "white" } }}>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="new"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
        </Stack>
      </View>
    </AuthProvider>
  )
}
