import dayjs from "dayjs"
import weekday from "dayjs/plugin/weekday"
import { create } from "zustand"
dayjs.extend(weekday)

export const DATE_BACK = dayjs().startOf("w").subtract(1, "w").format("YYYY-MM-DD")
export const DATE_FORWARD = dayjs().endOf("w").add(2, "w").add(1, "d").format("YYYY-MM-DD")

export const useTimelineTaskDates = create<{
  dateBack: string
  dateForward: string
  setDate: (date: string) => void
}>((set) => ({
  dateBack: DATE_BACK,
  dateForward: DATE_FORWARD,
  setDate: (date) =>
    set(({ dateBack, dateForward }) =>
      dayjs(date).isAfter(dayjs(dateForward))
        ? { dateForward: date }
        : dayjs(date).isBefore(dayjs(dateBack))
        ? { dateBack: date }
        : {},
    ),
}))
