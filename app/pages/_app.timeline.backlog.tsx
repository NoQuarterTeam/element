import * as React from "react"
import { RiAddLine, RiArrowDownSLine, RiArrowRightSLine, RiDeleteBinLine, RiEditLine } from "react-icons/ri"
import { Dialog } from "@headlessui/react"
import { type LoaderArgs, type SerializeFrom, json } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import dayjs from "dayjs"

import { TaskForm } from "~/components/TaskForm"
import { taskItemSelectFields } from "~/components/TaskItem"
import { Button } from "~/components/ui/Button"
import { Drawer } from "~/components/ui/Drawer"
import { IconButton } from "~/components/ui/IconButton"
import { Checkbox } from "~/components/ui/Inputs"
import { Tooltip } from "~/components/ui/Tooltip"
import { safeReadableColor } from "~/lib/color"
import { db } from "~/lib/db.server"
import { useDisclosure } from "~/lib/hooks/useDisclosure"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useFetcherSubmit } from "~/lib/hooks/useFetcherSubmit"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { TaskActionMethods } from "~/pages/_app.timeline.$id"
import { type TimelineTask } from "~/pages/api+/tasks"
import { getUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
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
  }, [])

  return (
    <Drawer isOpen={true} size="md" onClose={() => navigate("/timeline")} title="Backlog">
      <div className="relative h-screen overflow-scroll px-4 pb-40">
        <div className="items-center justify-between">
          <Button colorScheme="primary" leftIcon={<RiAddLine />} onClick={createModalProps.onOpen}>
            Add
          </Button>

          <Dialog open={createModalProps.isOpen} as="div" className="relative z-50" onClose={createModalProps.onClose}>
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full flex-col items-center justify-start p-0 sm:p-4">
                <Dialog.Panel className="mt-10 w-full max-w-xl overflow-hidden bg-white text-left shadow-xl transition-all dark:bg-gray-700">
                  <TaskForm onClose={createModalProps.onClose} />
                </Dialog.Panel>
              </div>
            </div>
          </Dialog>
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

  const updateFetcher = useFetcherSubmit<{ task: TimelineTask }>({ onSuccess: (data) => addTask(data.task) })

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
                rounded="full"
                size="xs"
                aria-label="show description"
                icon={isOpen ? <RiArrowRightSLine /> : <RiArrowDownSLine />}
              />
            </Tooltip>
          )}

          <Tooltip label="Edit">
            <IconButton
              variant="outline"
              onClick={editModalProps.onOpen}
              rounded="full"
              size="xs"
              aria-label="edit"
              icon={<RiEditLine />}
            />
          </Tooltip>
          <Tooltip label="Delete">
            <deleteFetcher.Form method="post" replace action={`/timeline/${task.id}`}>
              <IconButton
                variant="outline"
                type="submit"
                name="_action"
                value={TaskActionMethods.DeleteTask}
                rounded="full"
                size="xs"
                aria-label="delete"
                icon={<RiDeleteBinLine />}
              />
            </deleteFetcher.Form>
          </Tooltip>
          <Dialog open={editModalProps.isOpen} as="div" className="relative z-50" onClose={editModalProps.onClose}>
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full flex-col items-center justify-start p-0 sm:p-4">
                <Dialog.Panel className="mt-10 w-full max-w-xl overflow-hidden bg-white text-left shadow-xl transition-all dark:bg-gray-700">
                  <TaskForm task={task} onClose={editModalProps.onClose} />
                </Dialog.Panel>
              </div>
            </div>
          </Dialog>

          <updateFetcher.Form action={`/timeline/${task.id}`} replace method="post">
            <input type="hidden" name="date" value={dayjs().startOf("d").add(12, "h").format()} />
            <Tooltip label="Add to timeline">
              <IconButton
                variant="outline"
                type="submit"
                rounded="full"
                name="_action"
                value={TaskActionMethods.UpdateTask}
                size="xs"
                aria-label="add to timeline"
                icon={<RiAddLine />}
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
