import * as React from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Slot, SplashScreen } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as Updates from "expo-updates"
import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { View } from "react-native"
import { useFonts, Poppins_400Regular, Poppins_700Bold, Poppins_900Black, Poppins_600SemiBold } from "@expo-google-fonts/poppins"

import { TRPCProvider } from "../lib/utils/api"
import { IS_DEV } from "../lib/config"

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  })
  const [isFinishedCheckingUpdates, setisFinishedCheckingUpdates] = React.useState(false)

  React.useEffect(() => {
    if (IS_DEV) return
    async function expoUpdates() {
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync()
        if (!isAvailable) return setisFinishedCheckingUpdates(true)
        const { isNew } = await Updates.fetchUpdateAsync()
        if (!isNew) return setisFinishedCheckingUpdates(true)
        await Updates.reloadAsync()
      } catch (e) {
        // console.log(e);
      }
    }
    expoUpdates()
  }, [])

  // Prevent rendering until the font has loaded
  if (!fontsLoaded || !isFinishedCheckingUpdates) return <SplashScreen />

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
