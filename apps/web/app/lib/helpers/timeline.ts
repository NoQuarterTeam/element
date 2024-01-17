import { type DraggableLocation } from "@hello-pangea/dnd"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"

import type { TimelineTask } from "~/pages/api+/tasks"

export const MONTH_NAMES = ["jan.", "feb.", "mar.", "apr.", "may.", "jun.", "jul.", "aug.", "sept.", "oct.", "nov.", "dec."]

export const getDays = (startDate: Dayjs, daysCount: number) => {
  return Array.from({ length: daysCount }).map((_, i) => startDate.add(i, "day").format("YYYY-MM-DD"))
}

export const getMonths = (startDate: Dayjs, daysCount: number) => {
  // Include year to cater for scrolling further than 12
  const monthsByDay = Array.from({ length: daysCount }).map(
    (_, i) => startDate.add(i, "day").month() + "/" + startDate.add(i, "day").year(),
  )
  const uniqueMonths = monthsByDay.filter((value, index, array) => array.indexOf(value) === index)
  return uniqueMonths.map((month) => ({
    month: Number(month.split("/", 2)[0]),
    year: Number(month.split("/", 2)[1]),
  }))
}

export type ReorderTask = Pick<TimelineTask, "id" | "order" | "date">
function reorder<R>(list: R[], startIndex: number, endIndex: number): R[] {
  const result = list
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed!)
  return result
}

export const reorderTasks = (source: DraggableLocation, destination: DraggableLocation, dayTasks: ReorderTask[]) => {
  const orderedTasks = reorder<ReorderTask>(dayTasks, source.index, destination.index)
  return orderedTasks.map((task, index) => ({ ...task, order: index }))
}

export function moveTasks(
  source: ReorderTask[],
  destination: ReorderTask[],
  droppableSource: DraggableLocation,
  droppableDestination: DraggableLocation,
): [ReorderTask[], ReorderTask[]] {
  const sourceClone = [...source]
  const destClone = [...destination]
  const [removed] = sourceClone.splice(droppableSource.index, 1)
  destClone.splice(droppableDestination.index, 0, removed!)

  const updatedDestinationTasksByDay = destClone.map((task, index) => {
    const date = dayjs(droppableDestination.droppableId).startOf("day").add(12, "hours").toISOString()
    return { ...task, order: index, date }
  })

  const updatedSourceTasksByDay = sourceClone.map((task, index) => ({ ...task, order: index }))

  return [updatedSourceTasksByDay, updatedDestinationTasksByDay]
}

export const getDayTasksAndOrder = (tasks: ReorderTask[], target: any) => {
  return tasks.filter((t) => dayjs(t.date).isSame(dayjs(target.droppableId), "date"))
}
