import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_900Black, useFonts } from "@expo-google-fonts/poppins"
import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { Slot, SplashScreen } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { NewUpdate } from "../components/NewUpdate"
import { useCheckExpoUpdates } from "../lib/hooks/useCheckExpoUpdates"
import { TRPCProvider } from "../lib/utils/api"

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  })
  const { isDoneChecking, isNewUpdateAvailable } = useCheckExpoUpdates()

  // Prevent rendering until the font has loaded
  if (!fontsLoaded || !isDoneChecking) return <SplashScreen />

  return (
    <ActionSheetProvider>
      <TRPCProvider>
        <SafeAreaProvider>
          <View className="flex-1 bg-white dark:bg-black">{isNewUpdateAvailable ? <NewUpdate /> : <Slot />}</View>
          <StatusBar />
        </SafeAreaProvider>
      </TRPCProvider>
    </ActionSheetProvider>
  )
}
