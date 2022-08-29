import { useQueryClient } from "@tanstack/react-query"

import type { TimelineTask } from "~/pages/api.tasks"

import type { ReorderTask } from "../helpers/timeline"
import { useTimelineDays } from "./useTimelineDays"

export const DAYS_BACK = 20
export const DAYS_FORWARD = 40

export function useTimelineTasks() {
  const { daysBack, daysForward } = useTimelineDays((s) => ({
    daysBack: s.daysBack,
    daysForward: s.daysForward,
  }))
  const client = useQueryClient()

  return {
    refetch: () => {
      client.prefetchQuery(["tasks", { daysBack, daysForward }]).catch()
    },
    setTasks: (tasks: TimelineTask[]) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { daysBack, daysForward }]) || []
      client.setQueryData(["tasks", {}], [...existingTasks, ...tasks])
    },
    addTask: (task: TimelineTask) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { daysBack, daysForward }]) || []
      client.setQueryData(["tasks", { daysBack, daysForward }], [...existingTasks, task])
    },
    removeTask: (task: TimelineTask) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { daysBack, daysForward }]) || []
      client.setQueryData(
        ["tasks", { daysBack, daysForward }],
        existingTasks.filter((t) => t.id !== task.id),
      )
    },
    updateTask: (task: TimelineTask) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { daysBack, daysForward }]) || []
      client.setQueryData(
        ["tasks", { daysBack, daysForward }],
        existingTasks.map((t) => (t.id === task.id ? task : t)),
      )
    },
    updateOrder: (orderedTasks: ReorderTask[]) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { daysBack, daysForward }]) || []
      const newTasks = existingTasks.map((t) => {
        const task = orderedTasks.find((o) => o.id === t.id)
        if (task) return { ...t, order: task.order, date: task.date }
        return t
      })
      client.setQueryData(["tasks", { daysBack, daysForward }], newTasks)
    },
  }
}
