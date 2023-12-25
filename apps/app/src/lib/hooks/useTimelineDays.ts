import { create } from "zustand"

export const initialDaysBack = 14
export const initialDaysForward = 30

export const useTimelineDays = create<{
  daysBack: number
  daysForward: number
  setDaysBack: (days: number) => void
  setDaysForward: (days: number) => void
}>()((set) => ({
  daysBack: initialDaysBack,
  daysForward: initialDaysForward,
  setDaysBack: (days) => set({ daysBack: days }),
  setDaysForward: (days) => set({ daysForward: days }),
}))
