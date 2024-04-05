import * as Sentry from "@sentry/react-native"
import * as Updates from "expo-updates"
import * as React from "react"
import { AppState, type AppStateStatus } from "react-native"

import { IS_DEV } from "../config"

const TIMEOUT_KEY = "TIMEOUT"
export function useCheckExpoUpdates() {
  const [isDoneChecking, setIsDoneChecking] = React.useState(false)
  const appState = React.useRef(AppState.currentState)

  const checkForExpoUpdates = async () => {
    try {
      if (IS_DEV) return setIsDoneChecking(true)
      let timeout: NodeJS.Timeout | undefined
      const timeoutRace: Promise<never> = new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(TIMEOUT_KEY)), 10000)
      })
      const { isAvailable } = await Promise.race([Updates.checkForUpdateAsync(), timeoutRace])
      if (timeout) clearTimeout(timeout)
      if (isAvailable) {
        await Updates.fetchUpdateAsync()
        await Updates.reloadAsync()
      }
    } catch (error) {
      if (!(error instanceof Error)) return
      if (error.message === TIMEOUT_KEY) return
      Sentry.captureException(error)
    } finally {
      setIsDoneChecking(true)
    }
  }

  const handleAppStateChange = React.useCallback(
    (nextAppState: AppStateStatus) => {
      const isBackground = appState.current === "background"
      if (isBackground && nextAppState === "active") {
        void checkForExpoUpdates()
      } else {
        setIsDoneChecking(true)
      }
      appState.current = nextAppState
    },
    [checkForExpoUpdates],
  )

  React.useEffect(() => {
    checkForExpoUpdates()
    const subscription = AppState.addEventListener("change", handleAppStateChange)
    return () => {
      subscription.remove()
    }
  }, [handleAppStateChange, checkForExpoUpdates])

  return { isDoneChecking }
}
