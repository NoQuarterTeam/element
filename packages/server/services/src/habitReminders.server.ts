import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

import { type Habit } from "@element/database/types"
import { FULL_WEB_URL, IS_DEV } from "@element/server-env"

import { qstash } from "./lib/qstash.server"
dayjs.extend(utc)

export type HabitReminderBody = Pick<Habit, "id" | "name">

export function createHabitReminder(habit: Pick<Habit, "id" | "name" | "reminderTime">) {
  try {
    if (!habit.reminderTime) throw new Error()

    // upstashs servers on utc
    const hour = dayjs.utc(habit.reminderTime).hour()
    const minute = dayjs.utc(habit.reminderTime).minute()

    const cron = `${minute} ${hour} * * *`
    const headers = new Headers()
    headers.append("Content-Type", "application/json")

    return qstash.schedules.create({
      cron,
      body: JSON.stringify({ id: habit.id, name: habit.name } satisfies HabitReminderBody),
      headers,
      destination: IS_DEV ? "https://element.requestcatcher.com" : FULL_WEB_URL + "/api/habit-reminders",
    })
  } catch (error) {
    console.log("Error creating schedule")
  }
}
export async function deleteHabitReminder(id: string) {
  return qstash.schedules.delete(id)
}
