import { type TaskRepeat } from "@prisma/client"
import dayjs from "dayjs"

export const getRepeatingDatesBetween = (startDate: Date, endDate: Date, repeat: TaskRepeat) => {
  const dates = []
  if (dayjs(endDate).isBefore(dayjs(startDate))) return []
  const repeatPeriod =
    repeat === "DAILY"
      ? "day"
      : repeat === "MONTHLY"
      ? "month"
      : repeat === "WEEKLY"
      ? "week"
      : repeat === "YEARLY"
      ? "year"
      : "d"

  let currentDate = dayjs(startDate).add(1, repeatPeriod).toDate()
  while (dayjs(currentDate).isBefore(dayjs(endDate)) || dayjs(currentDate).isSame(dayjs(endDate), "date")) {
    dates.push(currentDate)
    currentDate = dayjs(currentDate).add(1, repeatPeriod).toDate()
  }
  return dates
}
