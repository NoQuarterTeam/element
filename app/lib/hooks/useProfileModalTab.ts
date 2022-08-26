import create from "zustand"
import { persist } from "zustand/middleware"

export type Tab = "account" | "plan" | "billing" | "settings"
interface Create {
  tab: Tab
  setTab: (tab: Tab) => void
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
