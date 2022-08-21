import create from "zustand"
import { persist } from "zustand/middleware"

export const NEW_UPDATES = ["weather"]

interface Create {
  updatesSeens: string[]
  setUpdatesSeens: (updates: string[]) => void
}

export const useUpdatesSeen = create<Create>()(
  persist(
    (set) => ({
      updatesSeens: [],
      setUpdatesSeens: (newUpdates) =>
        set((state) => ({
          updatesSeens: Array.from(new Set([...state.updatesSeens, ...newUpdates])),
        })),
    }),
    { name: "element.updates" },
  ),
)
