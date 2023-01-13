import { create } from "zustand"

export const SCROLL_DAYS_FORWARD = 60
export const SCROLL_DAYS_BACK = 30

export const useTimelineScroll = create<{
  daysForward: number
  daysBack: number
  setDaysForward: (number: number) => void
  setDaysBack: (number: number) => void
}>((set) => ({
  daysBack: SCROLL_DAYS_BACK,
  daysForward: SCROLL_DAYS_FORWARD,
  setDaysBack: (daysBack) => set(() => ({ daysBack })),
  setDaysForward: (daysForward) => set(() => ({ daysForward })),
}))
