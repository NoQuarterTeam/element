import { SafeAreaProvider } from "react-native-safe-area-context"
import { Slot, SplashScreen } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { useFonts, Poppins_400Regular, Poppins_700Bold, Poppins_900Black, Poppins_600SemiBold } from "@expo-google-fonts/poppins"

import { TRPCProvider } from "../lib/utils/api"
import { View } from "react-native"
// import { useColorScheme } from "react-native"

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  })

  // Prevent rendering until the font has loaded
  if (!fontsLoaded) return <SplashScreen />

  return (
    <ActionSheetProvider>
      <TRPCProvider>
        <SafeAreaProvider>
          <View className="flex-1 bg-white dark:bg-black">
            <Slot />
          </View>
          <StatusBar />
        </SafeAreaProvider>
      </TRPCProvider>
    </ActionSheetProvider>
  )
}