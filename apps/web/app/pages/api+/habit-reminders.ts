import { type HabitReminderBody, qstashReceiver } from "@element/server-services"
import type { ActionFunctionArgs } from "@remix-run/node"
import dayjs from "dayjs"
import { Expo, type ExpoPushMessage } from "expo-server-sdk"

import { db } from "~/lib/db.server"
import { badRequest, json } from "~/lib/remix"

const expo = new Expo()

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const signature = request.headers.get("upstash-signature")
    if (!signature) {
      return badRequest({ success: false, message: "no signature" })
    }
    const body = await request.text()
    await qstashReceiver.verify({ signature, body })

    const data = JSON.parse(body) as Partial<HabitReminderBody>
    const reminderId = data?.id
    if (!reminderId) return badRequest({ success: false, message: "no habit id provided" })
    const reminder = await db.habitReminder.findUnique({
      where: { id: reminderId },
      select: {
        habit: {
          select: {
            archivedAt: true,
            creatorId: true,
            name: true,
            entries: { where: { createdAt: { gte: dayjs().startOf("day").toDate(), lte: dayjs().endOf("day").toDate() } } },
          },
        },
      },
    })
    if (!reminder) return badRequest({ success: false, message: "no habit reminder found" })
    if (reminder.habit.archivedAt) return json({ success: true, message: "habit archived" })
    if (reminder.habit.entries.length > 0) return json({ success: true, message: "habit already complete" })

    const pushTokens = await db.pushToken.findMany({ where: { userId: reminder.habit.creatorId } })

    const messages = pushTokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map(
        (t) =>
          ({
            to: t.token,
            body: `Here's a reminder to complete your habit: ${reminder.habit.name}!`,
            data: { url: "/habits" },
          }) satisfies ExpoPushMessage,
      )
    const chunks = expo.chunkPushNotifications(messages)

    // todod: need to check if the habit was complete for today, if so, dont send

    for await (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk)
      } catch (error) {
        console.log("-----------ERROR sending expo push notification")
        console.error(error)
      }
    }
    return json({ success: true })
  } catch (error) {
    console.log("-----------ERROR sending habit reminder")
    console.log(error)
    return badRequest({ success: false, message: "Error sending habit reminder" })
  }
}
