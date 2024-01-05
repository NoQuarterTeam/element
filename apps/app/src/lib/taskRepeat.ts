import { type TaskRepeat } from "@element/database/types"

export const TaskRepeatOptions: { [key in TaskRepeat]: string } = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
}
