import * as React from "react"
import { RiAddLine, RiDeleteBinLine, RiEditLine } from "react-icons/ri"
import { RiArrowDownSLine, RiArrowRightSLine } from "react-icons/ri"
import { type LoaderArgs, type SerializeFrom, json } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"

import { Button } from "~/components/ui/Button"
import { ButtonGroup } from "~/components/ui/ButtonGroup"
import { Drawer } from "~/components/ui/Drawer"
import { FormButton, InlineFormField } from "~/components/ui/Form"
import { IconButton } from "~/components/ui/IconButton"
import { Checkbox, Input, Textarea } from "~/components/ui/Inputs"
import { Modal } from "~/components/ui/Modal"
import { Singleselect } from "~/components/ui/ReactSelect"
import { Tooltip } from "~/components/ui/Tooltip"
import { safeReadableColor } from "~/lib/color"
import { db } from "~/lib/db.server"
import { type DisclosureProps, useDisclosure } from "~/lib/hooks/useDisclosure"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useFetcherSubmit } from "~/lib/hooks/useFetcherSubmit"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { TaskActionMethods } from "~/pages/_app.timeline.$id"
import { type TaskElement } from "~/pages/api+/elements"
import { type TimelineTask, TasksActionMethods } from "~/pages/api+/tasks"
import { getUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  const tasks = await db.task.findMany({
    select: {
      id: true,
      isComplete: true,
      durationHours: true,
      durationMinutes: true,
      description: true,
      name: true,
      element: {
        select: { id: true, name: true, color: true },
      },
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
      <div className="relative min-h-screen overflow-y-scroll px-4 pb-40">
        <div className="items-center justify-between">
          <Button colorScheme="primary" leftIcon={<RiAddLine />} onClick={createModalProps.onOpen}>
            Add
          </Button>

          <BacklogTaskForm {...createModalProps} />
        </div>
        <div className="stack pt-2">
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

function BacklogTaskForm({ task, ...createModalProps }: { task?: BacklogTask } & Omit<DisclosureProps, "children">) {
  const { data: elements } = useQuery(
    ["task-elements"],
    async () => {
      const response = await fetch(`/api/elements`)
      if (!response.ok) throw new Error("Network response was not ok")
      return response.json() as Promise<TaskElement[]>
    },
    { keepPreviousData: true, staleTime: 10_000 },
  )
  const taskFetcher = useFetcherSubmit({ onSuccess: createModalProps.onClose })

  const [element, setElement] = React.useState(
    task?.element ? { value: task.element.id, label: task.element.name, color: task.element.color } : undefined,
  )

  return (
    <Modal {...createModalProps}>
      <taskFetcher.Form method="post" replace action={task ? `/timeline/${task.id}` : "/api/tasks"}>
        <input
          className="w-full border-none bg-transparent py-3 pl-4 pr-8 text-2xl text-gray-900 focus:outline-none dark:text-gray-100 md:py-4 md:text-4xl"
          required
          name="name"
          placeholder="Name"
          defaultValue={task?.name}
          autoFocus
        />
        <div className="stack p-4 pt-0">
          <input type="hidden" name="elementId" value={element?.value} />
          <InlineFormField
            required
            label="Element"
            name="element"
            error={taskFetcher.data?.fieldErrors?.elementId?.[0]}
            input={
              <Singleselect
                value={element}
                onChange={setElement}
                formatOptionLabel={(option) => (
                  <div className="hstack">
                    <div className="rounded-full sq-4" style={{ background: option.color }} />
                    <p>{option.label}</p>
                  </div>
                )}
                options={elements?.map((e) => ({ label: e.name, value: e.id, color: e.color }))}
              />
            }
          />
          <InlineFormField
            name="durationHours"
            label="Duration"
            shouldPassProps={false}
            error={taskFetcher.data?.fieldErrors?.durationHours?.[0] || taskFetcher.data?.fieldErrors?.durationMinutes?.[0]}
            input={
              <div className="hstack">
                <div className="hstack space-x-1">
                  <Input
                    className="px-0 text-center sq-8"
                    defaultValue={task?.durationHours ? task.durationHours.toString() : undefined}
                    id="durationHours"
                    min={0}
                    max={24}
                    name="durationHours"
                  />
                  <p className="text-xs opacity-80">Hours</p>
                </div>
                <div className="hstack space-x-1">
                  <Input
                    className="px-0 text-center sq-8"
                    defaultValue={task?.durationMinutes ? task.durationMinutes.toString() : undefined}
                    max={60}
                    min={0}
                    name="durationMinutes"
                  />
                  <p className="text-xs opacity-80">Minutes</p>
                </div>
              </div>
            }
          />
          <InlineFormField
            name="description"
            defaultValue={task?.description}
            label="Description"
            input={<Textarea rows={6} />}
            error={taskFetcher.data?.fieldErrors?.description?.[0]}
          />
          <ButtonGroup>
            <Button variant="ghost" onClick={createModalProps.onClose}>
              Cancel
            </Button>
            <FormButton
              colorScheme="primary"
              name="_action"
              value={task ? TaskActionMethods.UpdateTask : TasksActionMethods.AddTask}
              isLoading={taskFetcher.state !== "idle"}
            >
              {task ? "Update" : "Create"}
            </FormButton>
          </ButtonGroup>
        </div>
      </taskFetcher.Form>
    </Modal>
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
    <div className="rounded-sm border-t border-gray-50 dark:border-gray-600">
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
          <BacklogTaskForm task={task} {...editModalProps} />

          <updateFetcher.Form action={`/timeline/${task.id}`} replace method="post">
            <input type="hidden" name="date" value={dayjs().format()} />
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
      {isOpen && task.description && (
        <p className="w-full rounded-sm bg-gray-50 p-2 text-sm dark:bg-gray-800">{task.description}</p>
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
