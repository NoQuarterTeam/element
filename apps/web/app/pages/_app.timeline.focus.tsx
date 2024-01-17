import * as React from "react"
import { safeReadableColor, useDisclosure } from "@element/shared"
import * as ModalPrimitive from "@radix-ui/react-dialog"
import type { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import dayjs from "dayjs"
import { ChevronDown, ChevronRight, X } from "lucide-react"

import { IconButton } from "~/components/ui/IconButton"
import { Checkbox } from "~/components/ui/Inputs"
import { ModalOverlay, ModalPortal, ModalRoot } from "~/components/ui/Modal"
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
      date: { gt: dayjs().startOf("day").toDate(), lte: dayjs().endOf("d").toDate() },
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
    <ModalRoot open onOpenChange={() => navigate("/timeline")}>
      <ModalPortal position="top" className="pt-0 md:pt-0">
        <ModalOverlay />
        <ModalPrimitive.Content className="animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0 bg-background rounded-xs fixed z-50 grid h-screen w-screen overflow-y-scroll p-4">
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
          <ModalPrimitive.Close className="rounded-xs absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
            <X className="sq-4" />
            <span className="sr-only">Close</span>
          </ModalPrimitive.Close>
        </ModalPrimitive.Content>
      </ModalPortal>
    </ModalRoot>
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

        <div className="flex items-center space-x-2">
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
