import { type TaskReminderBody, qstashReceiver } from "@element/server-services"
import type { ActionFunctionArgs } from "@remix-run/node"

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

    const data = JSON.parse(body) as Partial<TaskReminderBody>
    const taskId = data?.id
    if (!taskId) return badRequest({ success: false, message: "no task id provided" })
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: {
        reminder: true,
        creatorId: true,
        date: true,
        startTime: true,
        name: true,
        upstashMessageId: true,
      },
    })
    if (!task) return badRequest({ success: false, message: "no task found" })
    if (!task.startTime || !task.reminder || !task.date) return json({ success: true })

    const pushTokens = await db.pushToken.findMany({ where: { userId: task.creatorId } })
    const messages = pushTokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map(
        (t) =>
          ({
            to: t.token,
            body: `Here's a reminder about your task ${task.name} at ${task.startTime}!`,
            data: { url: "/" },
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
    console.log("-----------ERROR sending task")
    console.log(error)
    return badRequest({ success: false, message: "Error sending task" })
  }
}
