import * as React from "react"
import type { DropResult } from "@hello-pangea/dnd"
import { DragDropContext } from "@hello-pangea/dnd"
import { useFetcher } from "@remix-run/react"

import type { ReorderTask } from "~/lib/helpers/timeline"
import { getDayTasksAndOrder, moveTasks, reorderTasks } from "~/lib/helpers/timeline"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"

interface Props {
  tasks: ReorderTask[]
  children: React.ReactNode
}

export const DropContainer = React.memo(_DropContainer)
function _DropContainer({ children, tasks }: Props) {
  const { updateOrder } = useTimelineTasks()

  // Ordering
  const updateOrderFetcher = useFetcher()
  const handleReorder = React.useCallback(
    (orderedTasks: ReorderTask[]) => {
      updateOrder(orderedTasks)
      updateOrderFetcher.submit(
        { _action: "updateOrder", tasks: JSON.stringify(orderedTasks) },
        { method: "post", action: "/api/tasks" },
      )
    },
    [updateOrderFetcher, updateOrder],
  )

  const onDragEnd = React.useCallback(
    ({ source, destination }: DropResult) => {
      if (!destination) return
      if (source.droppableId === destination.droppableId) {
        // If re-ordering
        const dayTasks = getDayTasksAndOrder(tasks, source)
        const reorderedTasks = reorderTasks(source, destination, dayTasks)
        handleReorder(reorderedTasks)
      } else {
        // If moving to other day
        const sourceList = getDayTasksAndOrder(tasks, source)
        const destinationList = getDayTasksAndOrder(tasks, destination)
        const result = moveTasks(sourceList, destinationList, source, destination)
        handleReorder(result.flat())
      }
    },
    [tasks, handleReorder],
  )

  return <DragDropContext onDragEnd={onDragEnd}>{children}</DragDropContext>
}
