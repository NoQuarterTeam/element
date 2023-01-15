import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons"
import { Dialog } from "@headlessui/react"
import type { LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import dayjs from "dayjs"

import { CloseButton } from "~/components/ui/CloseButton"
import { IconButton } from "~/components/ui/IconButton"
import { Checkbox } from "~/components/ui/Inputs"
import { useModal } from "~/components/ui/Modal"
import { Tooltip } from "~/components/ui/Tooltip"
import { safeReadableColor } from "~/lib/color"
import { db } from "~/lib/db.server"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { getUser } from "~/services/auth/auth.server"

import { TaskActionMethods } from "./_app.timeline.$id"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)

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
  }, [])

  return (
    <Dialog open={true} as="div" className="relative z-50" onClose={() => navigate("/timeline")}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 overflow-y-auto">
        <Dialog.Panel className="relative h-full w-full bg-white dark:bg-gray-900">
          <div className="absolute top-2 right-4">
            <CloseButton size="lg" onClick={() => navigate("/timeline")} />
          </div>
          <div className="my-4">
            <div className="vstack space-y-6 py-20">
              {tasks.length === 0 ? (
                <div className="vstack">
                  <img src="/logo.png" className="sq-[100px]" alt="logo" />
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
  const updateFetcher = useFetcher()
  React.useEffect(() => {
    if (!updateFetcher.data) return
    if (updateFetcher.type === "actionReload" && updateFetcher.data.task) {
      updateTask(updateFetcher.data.task)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFetcher.type, updateFetcher.data])
  const { isOpen, onToggle } = useModal()
  return (
    <div className="w-full max-w-[500px] rounded-sm border border-gray-200 dark:border-gray-600">
      <div className="flex items-start justify-between p-2">
        <p>{task.name}</p>

        <div className="hstack">
          {task.description && (
            <Tooltip label="Show description">
              <IconButton
                variant="outline"
                onClick={onToggle}
                rounded="full"
                size="xs"
                aria-label="show description"
                icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              />
            </Tooltip>
          )}

          <Checkbox
            className="sq-4"
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
