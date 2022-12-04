import create from "zustand"

export const BIG_DAYS = 100

export const useBigDays = create<{
  daysForward: number
  daysBack: number
  setDaysForward: (number: number) => void
  setDaysBack: (number: number) => void
}>((set) => ({
  daysForward: BIG_DAYS,
  daysBack: BIG_DAYS,
  setDaysForward: (daysForward) => set(() => ({ daysForward })),
  setDaysBack: (daysBack) => set(() => ({ daysBack })),
}))
