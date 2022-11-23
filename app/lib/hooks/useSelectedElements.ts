import create from "zustand"
import { persist } from "zustand/middleware"

export const useSelectedElements = create<{
  elementIds: string[]
  toggleElementId: (elementId: string) => void
}>()(
  persist(
    (set) => ({
      elementIds: [],
      toggleElementId: (elementId) =>
        set((state) => {
          const elementIds = state.elementIds.includes(elementId)
            ? state.elementIds.filter((id) => id !== elementId)
            : [...state.elementIds, elementId]
          return { elementIds }
        }),
    }),
    { name: "element.selectedElementIds" },
  ),
)

export const selectedUrlElements = (elementIds: string[]) =>
  elementIds.map((id) => `elementId=${id}`).join("&")
