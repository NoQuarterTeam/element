import * as React from "react"
import { AppState, type AppStateStatus } from "react-native"
import * as Updates from "expo-updates"
import * as Sentry from "sentry-expo"

import { IS_DEV } from "../config"

export function useCheckExpoUpdates() {
  const [isDoneChecking, setIsDoneChecking] = React.useState(false)
  const appState = React.useRef(AppState.currentState)

  const checkForExpoUpdates = async () => {
    try {
      if (IS_DEV) return setIsDoneChecking(true)
      const timeoutRace: Promise<never> = new Promise((_, reject) =>
        setTimeout(() => reject("Expo update timeout of 10s reached"), 10000),
      )
      const { isAvailable } = await Promise.race([Updates.checkForUpdateAsync(), timeoutRace])
      if (isAvailable) {
        await Updates.fetchUpdateAsync()
        await Updates.reloadAsync()
      }
    } catch (error) {
      console.log("expo update timeout reached")
      Sentry.Native.captureException(error)
    } finally {
      return setIsDoneChecking(true)
    }
  }

  const handleAppStateChange = React.useCallback((nextAppState: AppStateStatus) => {
    const isBackground = appState.current === "background"
    if (isBackground && nextAppState === "active") {
      void checkForExpoUpdates()
    } else {
      setIsDoneChecking(true)
    }
    appState.current = nextAppState
  }, [])

  React.useEffect(() => {
    checkForExpoUpdates()
    const subscription = AppState.addEventListener("change", handleAppStateChange)
    return () => {
      subscription.remove()
    }
  }, [handleAppStateChange])

  return { isDoneChecking }
}
