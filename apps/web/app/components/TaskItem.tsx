import * as React from "react"
import { type Prisma } from "@element/database/types"
import { formatDuration, join, safeReadableColor, useDisclosure } from "@element/shared"
import { Link, useNavigation } from "@remix-run/react"

import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { TaskActionMethods } from "~/pages/_app.timeline.$id"
import { type TimelineTask } from "~/pages/api+/tasks"

import { Button } from "./ui/Button"
import { ButtonGroup } from "./ui/ButtonGroup"
import { Modal } from "./ui/Modal"
import { ActionDataSuccessResponse } from "~/lib/form.server"
import { useFetcher } from "./ui/Form"
import { FORM_ACTION } from "~/lib/form"
import { useSelectedTasks } from "~/lib/hooks/useSelectedTasks"

export const taskItemSelectFields = {
  id: true,
  createdAt: true,
  name: true,
  description: true,
  durationHours: true,
  durationMinutes: true,
  date: true,
  isComplete: true,
  isImportant: true,
  repeat: true,
  repeatParentId: true,
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
  const { removeTask, updateTask, addTask, refetch } = useTimelineTasks()

  const { toggleTaskId, taskIds, removeTaskId } = useSelectedTasks()

  const deleteFetcher = useFetcher()
  const toggleCompleteFetcher = useFetcher()

  const dupeFetcher = useFetcher<ActionDataSuccessResponse<{ task: TimelineTask }>>({
    onFinish: (res) => {
      if (!res.success) return
      addTask(res.task)
    },
  })

  const handleClick = async (event: React.MouseEvent<any, MouseEvent>) => {
    if (event.metaKey && event.shiftKey) {
      event.preventDefault()
      // select task
      toggleTaskId(task.id)
    } else if (event.metaKey) {
      event.preventDefault()
      // Duplicate
      dupeFetcher.submit({ [FORM_ACTION]: TaskActionMethods.DuplicateTask }, { action: `/timeline/${task.id}`, method: "POST" })
    } else if (event.shiftKey) {
      event.preventDefault()
      // Delete
      // remove from selected tasks
      removeTaskId(task.id)
      if (task.repeat || task.repeatParentId) {
        deleteModalProps.onOpen()
      } else {
        handleDelete(false)
      }
    } else if (event.altKey) {
      event.preventDefault()
      // Toggle complete
      updateTask({ ...task, isComplete: !task.isComplete })
      toggleCompleteFetcher.submit(
        { [FORM_ACTION]: TaskActionMethods.UpdateTask, isComplete: String(!task.isComplete) },
        { action: `/timeline/${task.id}`, method: "POST" },
      )
    }
  }
  const navigation = useNavigation()
  const isNavigatingToItem = navigation.location?.pathname.includes(task.id) && navigation.state === "loading"

  const handleDelete = async (shouldDeleteFuture: boolean) => {
    deleteFetcher.submit(
      { [FORM_ACTION]: TaskActionMethods.DeleteTask, shouldDeleteFuture: shouldDeleteFuture ? "true" : "false" },
      { action: `/timeline/${task.id}`, method: "POST" },
    )
    await new Promise((res) => setTimeout(res, 500))
    if (shouldDeleteFuture) {
      refetch()
    } else {
      removeTask(task)
    }
  }

  const deleteModalProps = useDisclosure()

  return (
    <div className="w-day z-[1] p-2 pb-0" tabIndex={-1}>
      <Link to={task.id} onClick={handleClick} prefetch="intent" tabIndex={-1}>
        <div
          className={join(
            "group/task-item relative w-full cursor-pointer overflow-hidden rounded-md border border-gray-100 bg-white outline-none dark:border-gray-900 dark:bg-gray-700",
            task.isImportant &&
              !task.isComplete &&
              "border-primary-400 shadow-primary-400 dark:border-primary-400 shadow-[0_0_0_1px_black]",
            isNavigatingToItem && "animate-pulse-fast",
            taskIds.includes(task.id) && "border-red-400 shadow-[0_0_0_1px_black] shadow-red-400 dark:border-red-400",
          )}
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
                    "text-xxs mb-1",
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
                  <div className="circle-1.5 absolute right-1 top-1 opacity-70" style={{ background: task.element.color }} />
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
          {(task.repeat || task.repeatParentId) && (
            <Modal {...deleteModalProps} size="md" title="Deleting task">
              <div className="stack p-4">
                <p>Do you want to only delete this task or all future tasks as well?</p>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={deleteModalProps.onClose}>
                    Cancel
                  </Button>
                  <ButtonGroup>
                    <Button onClick={() => handleDelete(false)}>Delete this task</Button>
                    <Button variant="destructive" onClick={() => handleDelete(true)}>
                      Delete all future
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </Modal>
          )}
          <div
            style={{ backgroundColor: task.element.color }}
            className={join(
              "absolute bottom-0 left-0 flex h-1 w-full items-center overflow-hidden rounded-sm transition-all group-hover/task-item:h-4 group-hover/task-item:opacity-100",
              task.isComplete ? "opacity-40" : "opacity-100",
            )}
          >
            <p
              style={{ color: safeReadableColor(task.element.color) }}
              className="text-xxs truncate whitespace-nowrap pl-2 opacity-0 group-hover/task-item:opacity-100"
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
