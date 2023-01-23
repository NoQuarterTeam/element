import * as React from "react"
import { type Prisma } from "@prisma/client"
import { Link, useFetcher } from "@remix-run/react"

import { safeReadableColor } from "~/lib/color"
import { formatDuration } from "~/lib/helpers/duration"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { join } from "~/lib/tailwind"
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
  isImportant: true,
  order: true,
  startTime: true,
  element: { select: { id: true, color: true, name: true } },
  todos: { select: { isComplete: true } },
} satisfies Prisma.TaskSelect

interface Props {
  task: TimelineTask
}

const TODO_RADIUS = 5

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
    <div className="z-[1] w-day  p-2 pb-0" tabIndex={-1}>
      <Link to={task.id} onClick={handleClick} prefetch="intent" tabIndex={-1} className="">
        <div
          className={`group/task-item relative w-full cursor-pointer overflow-hidden rounded-md border border-gray-100  bg-${
            task.isImportant && !task.isComplete ? "primary-500" : "white"
          } outline-none dark:border-gray-900 dark:bg-${task.isImportant && !task.isComplete ? "primary-500" : "gray-700"} `}
        >
          <div
            className={join(
              "flex h-full w-full flex-col justify-between p-1.5",
              task.isComplete ? "blur-[1px] group-hover/task-item:blur-0" : "min-h-[60px]",
            )}
          >
            <div className={join(task.isComplete ? "mb-4" : "mb-2")}>
              <div>
                <p
                  className={join(
                    "mb-1 text-xxs",
                    task.isComplete ? "line-clamp-1" : "line-clamp-2 group-hover/task-item:line-clamp-6",
                  )}
                >
                  {task.name}
                </p>
                {!task.isComplete && task.todos.length > 0 && (
                  <svg className="-rotate-90" width="12" height="12">
                    <circle
                      strokeWidth="2"
                      className="stroke-gray-75 dark:stroke-white/20"
                      fill="transparent"
                      r={TODO_RADIUS}
                      cx="6"
                      cy="6"
                    />
                    <circle
                      style={{ stroke: task.element.color }}
                      strokeWidth="2"
                      fill="transparent"
                      strokeDasharray={`${TODO_RADIUS * 2 * Math.PI} ${TODO_RADIUS * 2 * Math.PI}`}
                      strokeDashoffset={
                        TODO_RADIUS * 2 * Math.PI -
                        (task.todos.filter((t) => t.isComplete).length / task.todos.length) * TODO_RADIUS * 2 * Math.PI
                      }
                      r={TODO_RADIUS}
                      cx="6"
                      cy="6"
                    />
                  </svg>
                )}

                {!task.isComplete && task.description && (
                  <div className="absolute top-1 right-1 opacity-70 circle-1.5" style={{ background: task.element.color }} />
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
            className={join(
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
