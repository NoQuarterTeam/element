// import * as React from "react"
import dayjs from "dayjs"
// import { create } from "zustand"

export const DAY_WIDTH = 90

export const daysBack = 14
export const daysForward = 30

// export const useTimelineDays = create<{
//   daysBack: number
//   daysForward: number
//   setDaysBack: (days: number) => void
//   setDaysForward: (days: number) => void
// }>()((set) => ({
//   daysBack: daysBack,
//   daysForward: daysForward,
//   setDaysBack: (days) => set({ daysBack: days }),
//   setDaysForward: (days) => set({ daysForward: days }),
// }))
export const useTimelineDays = () => {
  return {
    daysBack,
    daysForward,
  }
}

export const getMonths = (startDate: string, daysBack: number, daysForward: number) => {
  // Include year to cater for scrolling further than 12
  const monthsByDay = Array.from({ length: daysBack + daysForward }).map(
    (_, i) => dayjs(startDate).add(i, "day").month() + "/" + dayjs(startDate).add(i, "day").year(),
  )
  const uniqueMonths = monthsByDay.filter((value, index, array) => array.indexOf(value) === index)
  return uniqueMonths.map((month) => ({
    month: Number(month.split("/", 2)[0]),
    year: Number(month.split("/", 2)[1]),
  }))
}

export const getDays = (startDate: string, daysBack: number, daysForward: number) => {
  return Array.from({ length: daysBack + daysForward }).map((_, i) => dayjs(startDate).add(i, "day").format("YYYY-MM-DD"))
}

export const days = getDays(dayjs().subtract(daysBack, "days").format("YYYY-MM-DD"), daysBack, daysForward)

export const months = getMonths(dayjs().subtract(daysBack, "days").format("YYYY-MM-DD"), daysBack, daysForward).map(
  ({ month, year }, index) => {
    let dayCount
    if (index === 0) {
      const startDate = dayjs().subtract(daysBack, "days")
      dayCount = startDate.endOf("month").diff(startDate, "days") + 1
    } else {
      dayCount = dayjs().month(month).year(year).daysInMonth()
    }

    return {
      month,
      year,
      width: dayCount * DAY_WIDTH,
    }
  },
)
