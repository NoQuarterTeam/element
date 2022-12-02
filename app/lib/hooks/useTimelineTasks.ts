import { useQueryClient } from "@tanstack/react-query"

import type { TimelineTask } from "~/pages/api.tasks"

import type { ReorderTask } from "../helpers/timeline"
import { selectedUrlElements, useSelectedElements } from "./useSelectedElements"
import { useTimelineDays } from "./useTimelineDays"

export function useTimelineTasks() {
  const client = useQueryClient()
  const { back, forward } = useTimelineDays((s) => ({ back: s.daysBack, forward: s.daysForward }))
  const elementIds = useSelectedElements((s) => s.elementIds)
  return {
    refetch: async () => {
      try {
        const res = await client.fetchQuery(["tasks", { back, forward, elementIds }], async () => {
          const res = await fetch(
            `/api/tasks?back=${back}&forward=${forward}&${selectedUrlElements(elementIds)}`,
          )
          if (!res.ok) throw new Error("Failed to fetch tasks")
          return res.json() as Promise<TimelineTask[]>
        })
        client.setQueryData(["tasks", { elementIds }], res)
      } catch (error) {
        console.log(error)
      }
    },
    setTasks: (tasks: TimelineTask[]) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { elementIds }]) || []
      client.setQueryData(["tasks", { elementIds }], [...existingTasks, ...tasks])
    },
    addTask: (task: TimelineTask) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { elementIds }]) || []
      client.setQueryData(["tasks", { elementIds }], [...existingTasks, task])
    },
    removeTask: (task: TimelineTask) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { elementIds }]) || []
      client.setQueryData(
        ["tasks", { elementIds }],
        existingTasks.filter((t) => t.id !== task.id),
      )
    },
    updateTask: (task: TimelineTask) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { elementIds }]) || []
      client.setQueryData(
        ["tasks", { elementIds }],
        existingTasks.map((t) => (t.id === task.id ? task : t)),
      )
    },
    updateOrder: (orderedTasks: ReorderTask[]) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { elementIds }]) || []
      const newTasks = existingTasks.map((t) => {
        const task = orderedTasks.find((o) => o.id === t.id)
        if (task) return { ...t, order: task.order, date: task.date }
        return t
      })
      client.setQueryData(["tasks", { elementIds }], newTasks)
    },
  }
}
