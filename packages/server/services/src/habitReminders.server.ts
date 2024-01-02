import { FULL_WEB_URL } from "@element/server-env"
import { qstash } from "./lib/qstash"
import { Habit } from "@element/database/types"

export function createHabitReminder(habit: Pick<Habit, "id" | "reminderTime">) {
  if (!habit.reminderTime) return
  const cron = `${habit.reminderTime.split(":")[0]} ${habit.reminderTime.split(":")[1]} * * *`
  const headers = new Headers()
  headers.append("Content-Type", "application/json")

  return qstash.schedules.create({
    cron,
    body: JSON.stringify({ id: habit.id }),
    headers,
    destination: FULL_WEB_URL + "/api/habit-reminders",
  })
}
export async function deleteHabitReminder(id: string) {
  return qstash.schedules.delete(id)
}
