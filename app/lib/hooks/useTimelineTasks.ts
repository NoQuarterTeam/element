import { useSearchParams } from "@remix-run/react"
import { useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import type { TimelineTask } from "~/pages/api.tasks"

import type { ReorderTask } from "../helpers/timeline"
import { useTimelineDays } from "./useTimelineDays"

export const DAYS_BACK = 20
export const DAYS_FORWARD = 40

export function useTimelineTasks() {
  const client = useQueryClient()
  const { back, forward } = useTimelineDays((s) => ({ back: s.daysBack, forward: s.daysForward }))
  const [searchParams] = useSearchParams()
  const d = searchParams.get("d")
  const initialDay = d && dayjs(d).isValid() ? dayjs(d) : dayjs()
  const initialDate = initialDay.format("YYYY-MM-DD")
  return {
    refetch: async () => {
      try {
        const res = await client.fetchQuery(["tasks", { back, forward, initialDate }], async () => {
          const res = await fetch(`/api/tasks?back=${back}&forward=${forward}&d=${initialDate}`)
          if (!res.ok) throw new Error("Failed to fetch tasks")
          return res.json() as Promise<TimelineTask[]>
        })
        client.setQueryData(["tasks", { initialDate }], res)
      } catch (error) {
        console.log(error)
      }
    },
    setTasks: (tasks: TimelineTask[]) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { initialDate }]) || []
      client.setQueryData(["tasks", { initialDate }], [...existingTasks, ...tasks])
    },
    addTask: (task: TimelineTask) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { initialDate }]) || []
      client.setQueryData(["tasks", { initialDate }], [...existingTasks, task])
    },
    removeTask: (task: TimelineTask) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { initialDate }]) || []
      client.setQueryData(
        ["tasks", { initialDate }],
        existingTasks.filter((t) => t.id !== task.id),
      )
    },
    updateTask: (task: TimelineTask) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { initialDate }]) || []
      client.setQueryData(
        ["tasks", { initialDate }],
        existingTasks.map((t) => (t.id === task.id ? task : t)),
      )
    },
    updateOrder: (orderedTasks: ReorderTask[]) => {
      const existingTasks = client.getQueryData<TimelineTask[]>(["tasks", { initialDate }]) || []
      const newTasks = existingTasks.map((t) => {
        const task = orderedTasks.find((o) => o.id === t.id)
        if (task) return { ...t, order: task.order, date: task.date }
        return t
      })
      client.setQueryData(["tasks", { initialDate }], newTasks)
    },
  }
}
