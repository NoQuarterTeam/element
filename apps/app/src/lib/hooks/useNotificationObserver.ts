import * as Notifications from "expo-notifications"
import * as React from "react"
import { router } from "expo-router"

Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }
  },
})

export function useNotificationObserver() {
  React.useEffect(() => {
    let isMounted = true

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url
      if (url) {
        router.push(url)
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return
      }
      redirect(response?.notification)
    })

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification)
    })

    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [])
}
