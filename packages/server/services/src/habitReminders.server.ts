import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

import type { HabitReminder } from "@element/database/types"
import { FULL_WEB_URL, IS_DEV } from "@element/server-env"

import { qstash } from "./lib/qstash.server"
dayjs.extend(utc)

export type HabitReminderBody = Pick<HabitReminder, "id">

export async function createHabitReminder(reminder: Pick<HabitReminder, "id" | "time">) {
  try {
    // upstashs servers on utc
    const hour = dayjs.utc(reminder.time).hour()
    const minute = dayjs.utc(reminder.time).minute()

    const cron = `${minute} ${hour} * * *`
    const headers = new Headers()
    headers.append("Content-Type", "application/json")

    const schedule = await qstash.schedules.create({
      cron,
      body: JSON.stringify({ id: reminder.id } satisfies HabitReminderBody),
      headers,
      destination: IS_DEV ? "https://element.requestcatcher.com" : `${FULL_WEB_URL}/api/habit-reminders`,
    })
    return schedule.scheduleId
  } catch (error) {
    console.log("Error creating schedule")
    console.log(error)
    throw error
  }
}

export async function deleteHabitReminder(id: string) {
  return qstash.schedules.delete(id).catch((error) => {
    console.log("Error deleting schedule")
    console.log(error)
  })
}
