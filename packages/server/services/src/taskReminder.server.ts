import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

import type { Task, TaskReminder } from "@element/database/types"
import { FULL_WEB_URL, IS_DEV } from "@element/server-env"

import { qstash } from "./lib/qstash.server"
dayjs.extend(utc)

export type TaskReminderBody = Pick<Task, "id">

const reminderHash = {
  AT_TIME: { minutes: 0, hours: 0 },
  MINUTES_5: { minutes: 5, hours: 0 },
  MINUTES_10: { minutes: 10, hours: 0 },
  MINUTES_15: { minutes: 15, hours: 0 },
  MINUTES_30: { minutes: 30, hours: 0 },
  HOURS_1: { minutes: 0, hours: 1 },
  HOURS_2: { minutes: 0, hours: 2 },
  DAYS_1: { minutes: 0, hours: 24 },
  DAYS_2: { minutes: 0, hours: 48 },
} satisfies Record<TaskReminder, { minutes: number; hours: number }>

export async function createTaskReminder(task: Pick<Task, "id" | "date" | "startTime" | "reminder">) {
  try {
    if (!task.startTime || !task.reminder || !task.date) return null
    const hour = Number(task.startTime.split(":")[0])
    const minute = Number(task.startTime.split(":")[1])
    // upstashs servers on utc
    const reminderDateTime = dayjs
      .utc(task.date)
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
    console.log("Error creating schedule")
    console.log(error)
    throw error
  }
}

export async function deleteTaskReminder(id: string) {
  return qstash.messages.delete(id).catch((error) => {
    console.log("Error deleting schedule")
    console.log(error)
  })
}
