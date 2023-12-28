import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { RouterInputs, RouterOutputs } from "../utils/api"
import { Element } from "@element/database/types"
import dayjs from "dayjs"

export const initialElement: Element[] = [
  {
    id: "1",
    name: "Work",
    color: "#F87171",
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    creatorId: "1",
    parentId: null,
  },
  {
    id: "2",
    name: "Personal",
    color: "#34D399",
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    creatorId: "1",
    parentId: null,
  },
]

export const useTemporaryData = create<{
  tasks: RouterOutputs["task"]["timeline"]
  addTask: (task: RouterInputs["task"]["create"]) => void
  deleteTask: (id: string) => void
  updateTask: (task: Partial<RouterInputs["task"]["update"]>) => void
  elements: RouterOutputs["element"]["all"]
  removeAll: () => void
  updateOrder: (tasks: RouterOutputs["task"]["timeline"]) => void
}>()(
  persist(
    (set) => ({
      updateOrder: (tasks) =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            const newTask = tasks.find((task) => task.id === t.id)
            return newTask ? newTask : t
          }),
        })),
      removeAll: () => set({ tasks: [], elements: initialElement }),
      elements: initialElement,
      tasks: [],
      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: new Date().getMilliseconds().toString(),
              ...formatTask(task),
              isComplete: false,
              order: state.tasks.filter((t) => t.date === task.date).length,
              element: state.elements.find((e) => e.id === task.elementId)!,
              elementId: task.elementId,
            },
          ],
        })),
      deleteTask: (id) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === id)
          if (!task) return { tasks: state.tasks }
          const tasksInDate = state.tasks.filter((t) => t.date === task?.date).filter((t) => t.id !== id)
          return {
            tasks: state.tasks
              .filter((t) => t.id !== id)
              .map((t) => {
                if (tasksInDate.find((d) => d.id === t.id)) {
                  return { ...t, order: tasksInDate.findIndex((d) => d.id === t.id) }
                }
                return t
              }),
          }
        }),
      updateTask: (task) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  ...formatTask(task),
                  element: state.elements.find((e) => e.id === task.elementId)!,
                  elementId: task.elementId,
                }
              : t,
          ),
        })),
    }),
    { name: "element.temporary.data", storage: createJSONStorage(() => AsyncStorage) },
  ),
)

function formatTask(data: Omit<RouterInputs["task"]["update"], "id">) {
  return {
    description: data.description as string,
    isComplete: data.isComplete as boolean,
    isImportant: data.isImportant as boolean,
    name: data.name as string,
    startTime: data.startTime as string,
    date: (data.date ? dayjs(data.date as string).format("YYYY-MM-DD") : null) as string,
    durationHours: data.durationHours as number,
    durationMinutes: data.durationMinutes as number,
  }
}
