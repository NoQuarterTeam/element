import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_900Black, useFonts } from "@expo-google-fonts/poppins"
import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import * as Sentry from "@sentry/react-native"
import dayjs from "dayjs"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useColorScheme as useNWColorScheme } from "nativewind"
import { PostHogProvider, usePostHog } from "posthog-react-native"
import * as React from "react"
import { View, useColorScheme } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { Toast } from "../components/Toast"
import { IS_PRODUCTION } from "../lib/config"
import { useCheckExpoUpdates } from "../lib/hooks/useCheckExpoUpdates"
import { useFeatures } from "../lib/hooks/useFeatures"
import { useMe } from "../lib/hooks/useMe"
import { useNotificationObserver } from "../lib/hooks/useNotificationObserver"
import { useBackgroundColor } from "../lib/tailwind"
import { TRPCProvider, api } from "../lib/utils/api"

Sentry.init({
  dsn: "https://2e39a63a183c7a7fab0f691b638da957@o204549.ingest.sentry.io/4506592060309504",
  debug: true,
})

export const unstable_settings = {
  initialRouteName: "(home)",
}

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

  const colorScheme = useColorScheme()
  const { setColorScheme } = useNWColorScheme()

  // biome-ignore lint/correctness/useExhaustiveDependencies: allow
  React.useEffect(() => {
    setColorScheme(colorScheme as "light" | "dark")
  }, [colorScheme])

  const onLayoutRootView = React.useCallback(() => SplashScreen.hideAsync(), [])

  const backgroundColor = useBackgroundColor()
  // Prevent rendering until the font has loaded
  if (!fontsLoaded) return null

  return (
    <TRPCProvider>
      <PostHogProvider
        autocapture
        apiKey="phc_2W9bqjQCsJjOLxyO5wcxb4m5aQrNRjUWmKA9mvu9lcF"
        options={{ host: "https://eu.posthog.com", enable: IS_PRODUCTION }}
      >
        <ActionSheetProvider>
          <PrefetchTabs>
            <IdentifyUser />
            <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <SafeAreaProvider>
                <View className="flex-1 bg-white dark:bg-black">
                  <Stack initialRouteName="(home)" screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
                    <Stack.Screen name="(home)" />
                    <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
                    <Stack.Screen name="onboarding" options={{ presentation: "modal" }} />
                  </Stack>
                </View>
                <Toast />
                <StatusBar />
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </PrefetchTabs>
        </ActionSheetProvider>
      </PostHogProvider>
    </TRPCProvider>
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
    Promise.all([
      utils.habit.progressToday.fetch(),
      utils.habit.allByDate.fetch({ date: dayjs().startOf("day").add(12, "hours").toDate() }),
    ])
      .catch()
      .finally(() => setIsDoneChecking(true))
  }, [me, isLoading, features, utils.habit.progressToday, utils.habit.allByDate])

  if (!isDoneChecking) return null
  return <>{props.children}</>
}

function IdentifyUser() {
  const { me, isLoading } = useMe()
  const posthog = usePostHog()
  React.useEffect(() => {
    if (isLoading || !me) return
    if (posthog) posthog.identify(me.id, { email: me.email, name: `${me.firstName} ${me.lastName}` })
    Sentry.setUser({ id: me.id, email: me.email })
  }, [me, isLoading, posthog])
  return null
}
