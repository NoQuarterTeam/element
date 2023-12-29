import * as React from "react"
import { safeReadableColor, useDisclosure } from "@element/shared"
import { Dialog } from "@headlessui/react"
import type { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import dayjs from "dayjs"
import { ChevronDown, ChevronRight } from "lucide-react"

import { CloseButton } from "~/components/ui/CloseButton"
import { IconButton } from "~/components/ui/IconButton"
import { Checkbox } from "~/components/ui/Inputs"
import { Tooltip } from "~/components/ui/Tooltip"
import { db } from "~/lib/db.server"
import { type ActionDataErrorResponse } from "~/lib/form.server"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { getCurrentUser } from "~/services/auth/auth.server"

import { TaskActionMethods } from "./_app.timeline.$id"
import { type TimelineTask } from "./api+/tasks"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)

  const tasks = await db.task.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      startTime: true,
      durationHours: true,
      durationMinutes: true,
      isComplete: true,
      element: { select: { id: true, name: true, color: true } },
    },
    where: {
      isComplete: { equals: false },
      creatorId: { equals: user.id },
      date: { gt: dayjs().startOf("d").toDate(), lte: dayjs().endOf("d").toDate() },
    },
  })

  return json(tasks)
}

type FocusTask = SerializeFrom<typeof loader>[0]
export default function Focus() {
  const navigate = useNavigate()
  const tasks = useLoaderData<typeof loader>()
  const setFeaturesSeen = useFeaturesSeen((s) => s.setFeaturesSeen)
  React.useEffect(() => {
    setFeaturesSeen(["focus"])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Dialog open={true} as="div" className="relative z-50" onClose={() => navigate("/timeline")}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 top-0 h-screen overflow-y-auto">
        <Dialog.Panel className="relative h-full w-full bg-white dark:bg-gray-800">
          <div className="absolute right-4 top-2">
            <CloseButton size="lg" onClick={() => navigate("/timeline")} />
          </div>
          <div className="my-4">
            <div className="vstack space-y-6 py-20">
              {tasks.length === 0 ? (
                <div className="vstack">
                  <img src="/logo.png" className="sq-24" alt="logo" />
                  <p className="text-center text-3xl">Looks like you're done for the day!</p>
                </div>
              ) : (
                tasks.map((task) => <FocusItem key={task.id} task={task} />)
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

function FocusItem({ task }: { task: FocusTask }) {
  const { updateTask } = useTimelineTasks()
  const updateFetcher = useFetcher<ActionDataErrorResponse<any> | { success: true; task: TimelineTask }>()
  React.useEffect(() => {
    if (!updateFetcher.data) return
    if (updateFetcher.state !== "idle" && updateFetcher.data.success) {
      updateTask(updateFetcher.data.task)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFetcher.state, updateFetcher.data])
  const { isOpen, onToggle } = useDisclosure()
  return (
    <div className="w-full max-w-lg rounded-sm border border-gray-200 dark:border-gray-600">
      <div className="flex items-start justify-between p-2">
        <p>{task.name}</p>

        <div className="hstack">
          {task.description && (
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
      {task.description && isOpen && (
        <p className="w-full rounded-sm bg-gray-50 p-2 text-sm dark:bg-gray-800">{task.description}</p>
      )}

      <p className="w-full px-2 text-xs" style={{ background: task.element.color, color: safeReadableColor(task.element.color) }}>
        {task.element.name}
      </p>
    </div>
  )
}
