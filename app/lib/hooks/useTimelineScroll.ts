import create from "zustand"

export const SCROLL_DAYS = 200

export const useTimelineScroll = create<{
  daysForward: number
  daysBack: number
  setDaysForward: (number: number) => void
  setDaysBack: (number: number) => void
}>((set) => ({
  daysForward: SCROLL_DAYS,
  daysBack: SCROLL_DAYS,
  setDaysForward: (daysForward) => set(() => ({ daysForward })),
  setDaysBack: (daysBack) => set(() => ({ daysBack })),
}))
