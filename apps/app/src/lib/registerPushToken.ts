import * as Notifications from "expo-notifications"
import { isAndroid } from "./utils/device"
import colors from "@element/tailwind-config/src/colors"

export async function registerPushToken() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()

    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== "granted") return

    const token = (await Notifications.getExpoPushTokenAsync({ projectId: "93cfd208-76bb-4e7c-b368-5a09679e1a72" })).data

    if (isAndroid) {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.primary[500],
      })
    }

    return token
  } catch (error) {
    console.log(error)
  }
}
