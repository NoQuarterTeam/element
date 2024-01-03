import * as Notifications from "expo-notifications"
import { isAndroid } from "./utils/device"
import colors from "@element/tailwind-config/src/colors"
import Constants from "expo-constants"

export async function registerPushToken() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()

    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== "granted") return

    const token = (await Notifications.getExpoPushTokenAsync({ projectId: Constants.expoConfig!.extra!.eas.projectId })).data

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
