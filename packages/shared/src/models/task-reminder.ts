import type { TaskReminder } from "@element/database/types"

export const reminderHash = {
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
