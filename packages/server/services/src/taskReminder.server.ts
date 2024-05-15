import dayjs from "dayjs"

import type { Task } from "@element/database/types"
import { FULL_WEB_URL, IS_DEV } from "@element/server-env"

import { reminderHash } from "@element/shared"
import { qstash } from "./lib/qstash.server"

export type TaskReminderBody = Pick<Task, "id">

export async function createTaskReminder(task: Pick<Task, "id" | "date" | "startTime" | "reminder">) {
  try {
    if (!task.startTime || !task.reminder || !task.date) return null
    const hour = Number(task.startTime.split(":")[0])
    const minute = Number(task.startTime.split(":")[1])
    // upstashs servers on utc
    const reminderDateTime = dayjs(task.date)
      .set("hour", hour)
      .set("minute", minute)
      .subtract(reminderHash[task.reminder].hours, "hours")
      .subtract(reminderHash[task.reminder].minutes, "minutes")
      .unix()

    const headers = new Headers()
    headers.append("Content-Type", "application/json")

    const job = await qstash.publishJSON({
      notBefore: reminderDateTime,
      body: JSON.stringify({ id: task.id } satisfies TaskReminderBody),
      headers,
      url: IS_DEV ? "https://element.requestcatcher.com" : `${FULL_WEB_URL}/api/task-reminder`,
    })

    return job.messageId
  } catch (error) {
    console.log(error)
    return null
  }
}

export async function deleteTaskReminder(id: string) {
  return qstash.messages.delete(id).catch((error) => {
    console.log("Error deleting schedule")
    console.log(error)
  })
}
