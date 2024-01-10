import { qstash } from "./lib/qstash.server"

export async function deleteHabitReminder(id: string) {
  return qstash.schedules.delete(id)
}
