import { create } from "zustand"

export const useSelectedTasks = create<{
  taskIds: string[]
  toggleTaskId: (taskId: string) => void
  clearSelection: () => void
  removeTaskId: (taskId: string) => void
}>()((set) => ({
  taskIds: [],
  toggleTaskId: (taskId) =>
    set((state) => {
      const taskIds = state.taskIds.includes(taskId) ? state.taskIds.filter((id) => id !== taskId) : [...state.taskIds, taskId]
      return { taskIds }
    }),
  removeTaskId: (taskId) =>
    set((state) => {
      const taskIds = state.taskIds.filter((id) => id !== taskId)
      return { taskIds }
    }),
  clearSelection: () => set({ taskIds: [] }),
}))
