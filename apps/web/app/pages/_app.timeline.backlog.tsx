import * as React from "react"
import { safeReadableColor, useDisclosure } from "@element/shared"

import { json, type LoaderFunctionArgs, type SerializeFrom } from "@remix-run/node"
import { useLoaderData, useNavigate } from "@remix-run/react"
import dayjs from "dayjs"
import { ChevronDown, ChevronRight, Edit2, Plus, Trash } from "lucide-react"

import { TaskForm } from "~/components/TaskForm"
import { taskItemSelectFields } from "~/components/TaskItem"
import { Button } from "~/components/ui/Button"
import { Drawer } from "~/components/ui/Drawer"
import { IconButton } from "~/components/ui/IconButton"
import { Checkbox } from "~/components/ui/Inputs"
import { Tooltip } from "~/components/ui/Tooltip"
import { db } from "~/lib/db.server"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"

import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { TaskActionMethods } from "~/pages/_app.timeline.$id"
import { type TimelineTask } from "~/pages/api+/tasks"
import { getCurrentUser } from "~/services/auth/auth.server"
import { useFetcher } from "~/components/ui/Form"
import { ActionDataSuccessResponse } from "~/lib/form.server"
import { ModalContent, ModalRoot } from "~/components/ui/Modal"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)
  const tasks = await db.task.findMany({
    select: {
      ...taskItemSelectFields,
      todos: { orderBy: { createdAt: "asc" }, select: { id: true, isComplete: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    where: { creatorId: user.id, date: { equals: null }, isComplete: { equals: false } },
  })
  return json(tasks)
}

export default function Backlog() {
  const tasks = useLoaderData<typeof loader>()
  const createModalProps = useDisclosure()
  const navigate = useNavigate()

  const setFeaturesSeen = useFeaturesSeen((s) => s.setFeaturesSeen)
  React.useEffect(() => {
    setFeaturesSeen(["backlog"])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Drawer isOpen={true} size="md" onClose={() => navigate("/timeline")} title="Backlog">
      <div className="relative h-screen overflow-scroll px-4 pb-40">
        <div className="items-center justify-between pt-4">
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={createModalProps.onOpen}>
            Add
          </Button>

          <ModalRoot open={createModalProps.isOpen} onOpenChange={createModalProps.onClose}>
            <ModalContent position="top" shouldHideCloseButton className="max-w-xl p-0">
              <TaskForm onClose={createModalProps.onClose} />
            </ModalContent>
          </ModalRoot>
        </div>
        <div className="stack overflow-scroll pt-2">
          {tasks.length === 0 ? (
            <div className="center">
              <p className="py-4">No tasks in the backlog!</p>
            </div>
          ) : (
            tasks.map((task) => <BacklogItem key={task.id} task={task} />)
          )}
        </div>
      </div>
    </Drawer>
  )
}

type BacklogTask = SerializeFrom<typeof loader>[0]

function BacklogItem({ task }: { task: BacklogTask }) {
  const editModalProps = useDisclosure()

  const { isOpen, onToggle } = useDisclosure()
  const { addTask } = useTimelineTasks()

  const updateFetcher = useFetcher<ActionDataSuccessResponse<{ task: TimelineTask }>>({
    onFinish: (data) => {
      if (!data.success) return
      addTask(data.task)
    },
  })

  const deleteFetcher = useFetcher()
  return (
    <div className="rounded-sm border border-gray-50 dark:border-gray-600">
      <div className="flex items-start justify-between p-2">
        <p>{task.name}</p>

        <div className="hstack">
          {(task.description || task.todos.length > 0) && (
            <Tooltip label="Show description">
              <IconButton
                variant="outline"
                onClick={onToggle}
                rounded
                size="xs"
                aria-label="show description"
                icon={isOpen ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              />
            </Tooltip>
          )}

          <Tooltip label="Edit">
            <IconButton
              variant="outline"
              onClick={editModalProps.onOpen}
              rounded
              size="xs"
              aria-label="edit"
              icon={<Edit2 size={16} />}
            />
          </Tooltip>
          <Tooltip label="Delete">
            <deleteFetcher.Form method="post" action={`/timeline/${task.id}`}>
              <IconButton
                variant="outline"
                type="submit"
                name="_action"
                value={TaskActionMethods.DeleteTask}
                rounded
                size="xs"
                aria-label="delete"
                icon={<Trash size={16} />}
              />
            </deleteFetcher.Form>
          </Tooltip>

          <ModalRoot open={editModalProps.isOpen} onOpenChange={editModalProps.onClose}>
            <ModalContent position="top" shouldHideCloseButton className="max-w-xl p-0">
              <TaskForm task={task} onClose={editModalProps.onClose} />
            </ModalContent>
          </ModalRoot>

          <updateFetcher.Form action={`/timeline/${task.id}`} method="POST">
            <input type="hidden" name="date" value={dayjs().startOf("d").add(12, "h").format()} />
            <Tooltip label="Add to timeline">
              <IconButton
                variant="outline"
                type="submit"
                rounded
                name="_action"
                value={TaskActionMethods.UpdateTask}
                size="xs"
                aria-label="add to timeline"
                icon={<Plus size={16} />}
              />
            </Tooltip>
          </updateFetcher.Form>

          <Checkbox
            defaultChecked={task.isComplete}
            onChange={() =>
              updateFetcher.submit(
                { _action: TaskActionMethods.CompleteBacklogTask },
                { action: `/timeline/${task.id}`, method: "post" },
              )
            }
          />
        </div>
      </div>
      {isOpen && (
        <div>
          {task.description && <p className="w-full rounded-sm bg-gray-50 p-2 text-sm dark:bg-gray-800">{task.description}</p>}
          {task.todos.length > 0 && (
            <div className="w-full rounded-sm bg-gray-50 p-2 text-sm dark:bg-gray-800">
              <p>Todos</p>
              <ul className="list-inside list-disc">
                {task.todos.map((todo) => (
                  <p key={todo.id}>- {todo.name}</p>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p
        className="w-full px-2 text-xs"
        style={{
          background: task.element.color,
          color: safeReadableColor(task.element.color),
        }}
      >
        {task.element.name}
      </p>
    </div>
  )
}
