import { ActionFunctionArgs } from "@remix-run/node"
import { badRequest, json } from "~/lib/remix"
import { Expo, ExpoPushMessage } from "expo-server-sdk"

import { db } from "~/lib/db.server"
import { HabitReminderBody, qstashReceiver } from "@element/server-services"
import dayjs from "dayjs"

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
    const habitId = data?.id
    if (!habitId) return badRequest({ success: false, message: "no habit id provided" })
    const habit = await db.habit.findUnique({
      where: { id: habitId },
      include: {
        entries: { where: { createdAt: { gte: dayjs().startOf("day").toDate(), lte: dayjs().endOf("day").toDate() } } },
      },
    })
    if (!habit) return json({ success: true, message: "habit deleted" })
    if (habit.archivedAt) return json({ success: true, message: "habit archived" })
    if (habit.entries.length > 0) return json({ success: true, message: "habit already complete" })

    const pushTokens = await db.pushToken.findMany({ where: { userId: habit.creatorId } })

    const messages = pushTokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map(
        (t) =>
          ({
            to: t.token,
            body: `Here's a reminder to complete your habit: ${habit.name}!`,
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
