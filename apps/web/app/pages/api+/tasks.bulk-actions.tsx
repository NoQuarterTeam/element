import type { ActionFunctionArgs } from "@remix-run/node"
import { CheckCircle, Circle, Trash, X } from "lucide-react"

import { useFetcher } from "~/components/ui/Form"
import { IconButton } from "~/components/ui/IconButton"
import { Tooltip } from "~/components/ui/Tooltip"
import { db } from "~/lib/db.server"
import { FORM_ACTION } from "~/lib/form"
import { type ActionDataSuccessResponse, createAction, createActions, formSuccess, getFormDataArray } from "~/lib/form.server"
import { useSelectedTasks } from "~/lib/hooks/useSelectedTasks"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"

const TASKS_KEY = "tasks"

enum Actions {
  DELETE = "delete",
  COMPLETE = "complete",
  UNCOMPLETE = "uncomplete",
}

export const action = async ({ request }: ActionFunctionArgs) => {
  return createActions<Actions>(request, {
    delete: () =>
      createAction(request).handler(async () => {
        const formData = await request.formData()
        const tasks = getFormDataArray(formData, TASKS_KEY).map((t) => ({
          id: t.id as string,
        }))
        if (tasks.length === 0) return formSuccess()
        await db.task.deleteMany({ where: { id: { in: tasks.map((t) => t.id) } } })
        return formSuccess()
      }),
    complete: () =>
      createAction(request).handler(async () => {
        const formData = await request.formData()
        const tasks = getFormDataArray(formData, TASKS_KEY).map((t) => ({
          id: t.id as string,
        }))
        if (tasks.length === 0) return formSuccess()
        await db.task.updateMany({ where: { id: { in: tasks.map((t) => t.id) } }, data: { isComplete: true } })
        return formSuccess()
      }),
    uncomplete: () =>
      createAction(request).handler(async () => {
        const formData = await request.formData()
        const tasks = getFormDataArray(formData, TASKS_KEY).map((t) => ({
          id: t.id as string,
        }))
        if (tasks.length === 0) return formSuccess()
        await db.task.updateMany({ where: { id: { in: tasks.map((t) => t.id) } }, data: { isComplete: false } })
        return formSuccess()
      }),
  })
}

const ACTION_URL = "/api/tasks/bulk-actions"

export function BulkActions() {
  const { removeTasks, refetch } = useTimelineTasks()
  const { taskIds, clearSelection } = useSelectedTasks()

  const deleteFetcher = useFetcher<ActionDataSuccessResponse<object>>({
    onFinish: (res) => {
      if (!res.success) return
      clearSelection()
      removeTasks(taskIds)
    },
  })
  const completeFetcher = useFetcher<ActionDataSuccessResponse<object>>({
    onFinish: (res) => {
      if (!res.success) return
      clearSelection()
      refetch()
    },
  })

  if (taskIds.length === 0) return null
  return (
    <div className="absolute bottom-4 left-0 right-0 md:bottom-8">
      <div className="flex items-center justify-center space-x-2">
        <IconButton rounded size="sm" aria-label="cancel" onClick={clearSelection} icon={<X size={16} />} />
        <deleteFetcher.Form method="post" action={ACTION_URL}>
          {taskIds.map((taskId, i) => (
            <input type="hidden" key={taskId} name={`${TASKS_KEY}[${i}].id`} value={taskId} />
          ))}
          <div className="relative flex items-center space-x-2">
            <Tooltip label="Delete selected tasks">
              <IconButton
                size="lg"
                name={FORM_ACTION}
                value={Actions.DELETE}
                rounded
                type="submit"
                aria-label="delete tasks"
                icon={<Trash className="sq-5 text-red-500" />}
              />
            </Tooltip>
          </div>
        </deleteFetcher.Form>
        <completeFetcher.Form method="post" action={ACTION_URL}>
          {taskIds.map((taskId, i) => (
            <input type="hidden" key={taskId} name={`${TASKS_KEY}[${i}].id`} value={taskId} />
          ))}
          <div className="relative flex items-center space-x-2">
            <Tooltip label="Uncomplete selected tasks">
              <IconButton
                name={FORM_ACTION}
                value={Actions.UNCOMPLETE}
                size="lg"
                rounded
                type="submit"
                aria-label="complete tasks"
                icon={<Circle className="sq-5" />}
              />
            </Tooltip>
          </div>
        </completeFetcher.Form>
        <completeFetcher.Form method="post" action={ACTION_URL}>
          {taskIds.map((taskId, i) => (
            <input type="hidden" key={taskId} name={`${TASKS_KEY}[${i}].id`} value={taskId} />
          ))}
          <div className="relative flex items-center space-x-2">
            <Tooltip label="Complete selected tasks">
              <IconButton
                name={FORM_ACTION}
                value={Actions.COMPLETE}
                size="lg"
                rounded
                type="submit"
                aria-label="complete tasks"
                icon={<CheckCircle className="sq-5" />}
              />
            </Tooltip>
          </div>
        </completeFetcher.Form>
        <p className="sq-5 flex items-center justify-center rounded-full border bg-white text-sm text-black">{taskIds.length}</p>
      </div>
    </div>
  )
}
