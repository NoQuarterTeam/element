import { FULL_WEB_URL } from "@element/server-env"
import { qstash } from "./lib/qstash"

export function createScheduledHabitReminders() {
  return qstash.schedules.create({
    cron: "0 12 * * *",
    destination: FULL_WEB_URL + "/api/habit-reminders",
  })
}
