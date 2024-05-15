import type { TaskReminder } from "@element/database/types"

export const taskReminderHash = {
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

export const TASK_REMINDER_OPTIONS: { value: TaskReminder; name: string }[] = [
  {
    value: "AT_TIME",
    name: "At time of task",
  },
  {
    value: "MINUTES_5",
    name: "5 minutes before",
  },
  {
    value: "MINUTES_10",
    name: "10 minutes before",
  },
  {
    value: "MINUTES_15",
    name: "15 minutes before",
  },
  {
    value: "MINUTES_30",
    name: "30 minutes before",
  },
  {
    value: "HOURS_1",
    name: "1 hour before",
  },
  {
    value: "HOURS_2",
    name: "2 hour before",
  },
  {
    value: "DAYS_1",
    name: "1 day before",
  },
  {
    value: "DAYS_2",
    name: "2 days before",
  },
]
