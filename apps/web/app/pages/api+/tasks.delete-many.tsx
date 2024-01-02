import { type ActionFunctionArgs } from "@remix-run/node"
import { Trash, X } from "lucide-react"
import { useFetcher } from "~/components/ui/Form"

import { IconButton } from "~/components/ui/IconButton"
import { Tooltip } from "~/components/ui/Tooltip"
import { db } from "~/lib/db.server"
import { ActionDataSuccessResponse, formSuccess, getFormDataArray } from "~/lib/form.server"

import { useSelectedTasks } from "~/lib/hooks/useSelectedTasks"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"

const TASKS_KEY = "tasks"

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const tasks = getFormDataArray(formData, TASKS_KEY).map((t) => ({
    id: t.id as string,
  }))
  if (tasks.length === 0) return formSuccess()
  await db.task.deleteMany({ where: { id: { in: tasks.map((t) => t.id) } } })
  return formSuccess()
}

const ACTION_URL = "/api/tasks/delete-many"

export function DeleteManyTasks() {
  const { removeTasks } = useTimelineTasks()
  const { taskIds, clearSelection } = useSelectedTasks()

  const fetcher = useFetcher<ActionDataSuccessResponse<object>>({
    onFinish: (res) => {
      if (!res.success) return
      clearSelection()
      removeTasks(taskIds)
    },
  })

  if (taskIds.length === 0) return null
  return (
    <div className="absolute bottom-4 left-0 right-0 md:bottom-8">
      <div className="flex items-center justify-center">
        <fetcher.Form method="post" action={ACTION_URL}>
          {taskIds.map((taskId, i) => (
            <input type="hidden" key={taskId} name={`${TASKS_KEY}[${i}].id`} value={taskId} />
          ))}
          <div className="relative flex items-center space-x-2">
            <IconButton rounded size="sm" aria-label="cancel" onClick={clearSelection} icon={<X size={16} />} />
            <Tooltip label="Delete selected tasks">
              <IconButton
                size="lg"
                className="text-red-500"
                rounded
                type="submit"
                aria-label="delete tasks"
                icon={<Trash className="sq-5" />}
              />
            </Tooltip>
            <p className="sq-5 absolute -right-1 -top-1 flex items-center justify-center rounded-full border border-red-700 bg-red-500 text-sm text-white">
              {taskIds.length}
            </p>
          </div>
        </fetcher.Form>
      </div>
    </div>
  )
}
