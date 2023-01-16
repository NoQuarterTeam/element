import * as React from "react"
import { type Prisma } from "@prisma/client"
import { Link, useFetcher } from "@remix-run/react"
import { cn } from "~/lib/tailwind"

import { safeReadableColor } from "~/lib/color"
import { formatDuration } from "~/lib/helpers/duration"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { TaskActionMethods } from "~/pages/_app.timeline.$id"
import { type TimelineTask } from "~/pages/api+/tasks"

export const taskSelectFields = {
  id: true,
  createdAt: true,
  name: true,
  description: true,
  durationHours: true,
  durationMinutes: true,
  date: true,
  isComplete: true,
  order: true,
  startTime: true,
  element: { select: { id: true, color: true, name: true } },
} satisfies Prisma.TaskSelect

interface Props {
  task: TimelineTask
}

function _TaskItem({ task }: Props) {
  const { removeTask, updateTask, addTask } = useTimelineTasks()

  const deleteFetcher = useFetcher()
  const toggleCompleteFetcher = useFetcher()

  const dupeFetcher = useFetcher()
  React.useEffect(() => {
    if (dupeFetcher.type === "actionReload" && dupeFetcher.data?.task) {
      addTask(dupeFetcher.data.task)
    }
  }, [dupeFetcher.data, dupeFetcher.type, addTask])

  const handleClick = async (event: React.MouseEvent<any, MouseEvent>) => {
    if (event.metaKey) {
      event.preventDefault()
      // Duplicate
      dupeFetcher.submit({ _action: TaskActionMethods.DuplicateTask }, { action: `/timeline/${task.id}`, method: "post" })
    } else if (event.shiftKey) {
      event.preventDefault()
      // Delete
      deleteFetcher.submit({ _action: TaskActionMethods.DeleteTask }, { action: `/timeline/${task.id}`, method: "post" })
      await new Promise((res) => setTimeout(res, 100))
      removeTask(task)
    } else if (event.altKey) {
      event.preventDefault()
      // Toggle complete
      updateTask({ ...task, isComplete: !task.isComplete })
      toggleCompleteFetcher.submit(
        { _action: TaskActionMethods.UpdateTask, isComplete: String(!task.isComplete) },
        { action: `/timeline/${task.id}`, method: "post" },
      )
    }
  }

  return (
    <div className="z-[1] w-day p-2 pb-0" tabIndex={-1}>
      <Link to={task.id} onClick={handleClick} prefetch="intent" tabIndex={-1} className="">
        <div className="group/task-item relative w-full cursor-pointer overflow-hidden rounded-md border border-gray-100 bg-white outline-none dark:border-gray-900 dark:bg-gray-700">
          <div
            className={cn(
              "flex h-full w-full flex-col justify-between p-[6px]",
              task.isComplete ? "blur-[1px] group-hover/task-item:blur-0" : "min-h-[60px]",
            )}
          >
            <div className={cn(task.isComplete ? "mb-4" : "mb-3")}>
              <div className="mb-1 flex justify-between">
                <p
                  className={cn("text-xxs", task.isComplete ? "line-clamp-1" : "line-clamp-2 group-hover/task-item:line-clamp-6")}
                >
                  {task.name}
                </p>
                {!task.isComplete && task.description && (
                  <div
                    className="h-0 w-0 rounded-sm border-t-8 border-l-8 border-l-transparent"
                    style={{ borderTopColor: task.element.color }}
                  />
                )}
              </div>
            </div>
            {!task.isComplete && (
              <div className="flex items-end justify-between">
                {task.durationHours || task.durationMinutes ? (
                  <p className="text-xxs">{formatDuration(task.durationHours, task.durationMinutes)}</p>
                ) : (
                  <div />
                )}
                {task.startTime ? <p className="text-xxs">{task.startTime}</p> : <div />}
              </div>
            )}
          </div>
          <div
            style={{ backgroundColor: task.element.color }}
            className={cn(
              "absolute bottom-0 left-0 flex h-1 w-full items-center overflow-hidden rounded-sm transition-all group-hover/task-item:h-4 group-hover/task-item:opacity-100",
              task.isComplete ? "opacity-40" : "opacity-100",
            )}
          >
            <p
              style={{ color: safeReadableColor(task.element.color) }}
              className="truncate whitespace-nowrap pl-2 text-xxs opacity-0 group-hover/task-item:opacity-100"
            >
              {task.element.name}
            </p>
          </div>
        </div>
      </Link>
    </div>
  )
}
export const TaskItem = React.memo(_TaskItem)
