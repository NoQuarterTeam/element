import { type TaskRepeat } from "@prisma/client"
import dayjs from "dayjs"

export const getRepeatingDatesBetween = (startDate: Date, endDate: Date, repeat: TaskRepeat) => {
  const dates = []
  if (dayjs(endDate).endOf("d").isBefore(dayjs(startDate))) return []
  const repeatPeriod = repeat === "DAILY" ? "day" : repeat === "MONTHLY" ? "month" : repeat === "WEEKLY" ? "week" : "year"
  let count = 1
  let currentDate = dayjs(startDate).add(1, repeatPeriod).toDate()
  while (dayjs(currentDate).isBefore(dayjs(endDate).endOf("d"))) {
    dates.push(currentDate)
    count++
    currentDate = dayjs(startDate).add(count, repeatPeriod).toDate()
  }
  return dates
}
