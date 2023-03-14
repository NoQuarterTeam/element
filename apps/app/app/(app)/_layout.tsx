import { Slot } from "expo-router"
import { View } from "react-native"

import { AuthProvider } from "../../components/AuthProvider"

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  return (
    <AuthProvider>
      <View className="pt-16">
        <Slot />
      </View>
    </AuthProvider>
  )
}
