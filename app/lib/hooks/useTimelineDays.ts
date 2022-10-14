import create from "zustand"

export const DAYS_BACK = 10

export const DAYS_FORWARD = 20

export const useTimelineDays = create<{
  daysForward: number
  daysBack: number
  setDaysForward: (number: number) => void
  setDaysBack: (number: number) => void
}>((set) => ({
  daysForward: DAYS_FORWARD,
  daysBack: DAYS_BACK,
  setDaysForward: (daysForward) => set(() => ({ daysForward })),
  setDaysBack: (daysBack) => set(() => ({ daysBack })),
}))
