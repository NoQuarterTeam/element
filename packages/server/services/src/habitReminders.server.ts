import { FULL_WEB_URL, IS_DEV } from "@element/server-env"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { qstash } from "./lib/qstash.server"
import { Habit } from "@element/database/types"
dayjs.extend(utc)

export type HabitReminderBody = Pick<Habit, "id" | "name">

export function createHabitReminder(habit: Pick<Habit, "id" | "name" | "reminderTime">) {
  if (!habit.reminderTime) return

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
}
export async function deleteHabitReminder(id: string) {
  return qstash.schedules.delete(id)
}
