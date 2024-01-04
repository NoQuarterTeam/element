import * as React from "react"
import { View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_900Black, useFonts } from "@expo-google-fonts/poppins"
import { SplashScreen, Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"

import { useCheckExpoUpdates } from "../lib/hooks/useCheckExpoUpdates"
import { useFeatures } from "../lib/hooks/useFeatures"
import { useMe } from "../lib/hooks/useMe"
import { useNotificationObserver } from "../lib/hooks/useNotificationObserver"
import { useBackgroundColor } from "../lib/tailwind"
import { api, TRPCProvider } from "../lib/utils/api"

SplashScreen.preventAutoHideAsync()

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  })
  useNotificationObserver()
  useCheckExpoUpdates()

  const onLayoutRootView = React.useCallback(() => SplashScreen.hideAsync(), [])

  const backgroundColor = useBackgroundColor()
  // Prevent rendering until the font has loaded
  if (!fontsLoaded) return null

  return (
    <ActionSheetProvider>
      <TRPCProvider>
        <PrefetchTabs>
          <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <SafeAreaProvider>
              <View className="flex-1 bg-white dark:bg-black">
                <Stack initialRouteName="(home)" screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
                  <Stack.Screen name="(home)" />
                  <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
                </Stack>
              </View>
              <StatusBar />
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </PrefetchTabs>
      </TRPCProvider>
    </ActionSheetProvider>
  )
}

function PrefetchTabs(props: { children: React.ReactNode }) {
  const [isDoneChecking, setIsDoneChecking] = React.useState(false)
  const { me, isLoading } = useMe()
  const features = useFeatures((s) => s.features)
  const utils = api.useUtils()
  React.useEffect(() => {
    if (isLoading) return
    if (!me) return setIsDoneChecking(true)
    if (!features.includes("habits")) return setIsDoneChecking(true)
    Promise.all([utils.habit.progressCompleteToday.prefetch(), utils.habit.today.prefetch()])
      .catch()
      .finally(() => setIsDoneChecking(true))
  }, [me, isLoading, features, utils.habit.progressCompleteToday, utils.habit.today])

  if (!isDoneChecking) return null
  return <>{props.children}</>
}
