import type { Task } from "@element/database"

export function formatTotalDuration(duration: number) {
  const hours = (duration / 60) | 0
  const minutes = duration % 60 | 0
  const hoursDisplay = hours ? `${hours}h` : ""
  const minutesDisplay = minutes ? `${minutes}m` : ""
  return hoursDisplay + minutesDisplay
}

export function getMinutesFromTasks(tasks: Pick<Task, "durationHours" | "durationMinutes">[]) {
  return tasks.reduce((total, task) => total + (task.durationHours || 0) * 60 + (task.durationMinutes || 0), 0)
}

export function getTotalTaskDuration(tasks: Pick<Task, "durationHours" | "durationMinutes">[]) {
  const totalMinutes = getMinutesFromTasks(tasks)
  return formatTotalDuration(totalMinutes)
}

export function formatDuration(hours?: number | null, minutes?: number | null) {
  const hoursDisplay = hours ? `${hours}h` : ""
  const minutesDisplay = minutes ? `${minutes}m` : ""
  return hoursDisplay + minutesDisplay
}
