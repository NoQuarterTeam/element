import create from "zustand"
import { persist } from "zustand/middleware"

export type TABS = "account" | "plan" | "billing" | "settings"
interface Create {
  tab: TABS
  setTab: (tab: TABS) => void
}

export const useProfileModalTab = create<Create>()(
  persist(
    (set) => ({
      tab: "account",
      setTab: (tab) => set(() => ({ tab })),
    }),
    { name: "element.profile.modal" },
  ),
)
