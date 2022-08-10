import create from "zustand"

export const useSelectedElements = create<{
  selectedElementIds: string[]
  setSelectedElementIds: (elements: string[]) => void
}>((set) => ({
  selectedElementIds: [],
  setSelectedElementIds: (selectedElementIds) => set(() => ({ selectedElementIds })),
}))
