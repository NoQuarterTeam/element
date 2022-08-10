import create from "zustand"

import type { TimelineTask } from "~/pages/api.tasks"

import type { ReorderTask } from "../helpers/timeline"

export const DAYS_BACK = 20
export const DAYS_FORWARD = 40

type TimelineTasks = {
  tasks: TimelineTask[]
  setTasks: (tasks: TimelineTask[]) => void
  mergeTasks: (tasks: TimelineTask[]) => void
  updateTask: (task: TimelineTask) => void
  updateOrder: (tasks: ReorderTask[]) => void
  addTask: (task: TimelineTask) => void
  removeTask: (task: TimelineTask) => void
}

export const useTimelineTasks = create<TimelineTasks>()((set) => ({
  tasks: [],
  setTasks: (tasks) => set((state) => ({ ...state, tasks })),
  addTask: (task: TimelineTask) => set((state) => ({ ...state, tasks: [...state.tasks, task] })),
  removeTask: (task: TimelineTask) =>
    set((state) => ({ ...state, tasks: state.tasks.filter((t) => t.id !== task.id) })),
  mergeTasks: (tasks) => set((state) => ({ tasks: [...tasks, ...state.tasks] })),
  updateTask: (task: TimelineTask) =>
    set((state) => ({ tasks: state.tasks.map((t) => (t.id === task.id ? task : t)) })),
  updateOrder: (orderedTasks) =>
    set((state) => {
      const newTasks = state.tasks.map((t) => {
        const task = orderedTasks.find((o) => o.id === t.id)
        if (task) return { ...t, order: task.order, date: task.date }
        return t
      })
      return { ...state, tasks: newTasks }
    }),
}))
