import * as React from "react"
import { RiAddLine } from "react-icons/ri"
import Select from "react-select"
import * as c from "@chakra-ui/react"
import type { LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"

import { ButtonGroup } from "~/components/ButtonGroup"
import { InlineFormField } from "~/components/Form"
import { Modal } from "~/components/Modal"
import { TooltipIconButton } from "~/components/TooltipIconButton"
import { safeReadableColor } from "~/lib/color"
import { db } from "~/lib/db.server"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { customSelectStyle } from "~/lib/styles/react-select"
import { requireUser } from "~/services/auth/auth.server"

import { TaskActionMethods } from "./_app.timeline.$id"
import type { TaskElement } from "./api.elements"
import { TasksActionMethods } from "./api.tasks"

const selectFields = {
  id: true,
  isComplete: true,
  name: true,
  element: {
    select: { id: true, name: true, color: true },
  },
}
export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const tasks = await db.task.findMany({
    select: selectFields,
    orderBy: { createdAt: "desc" },
    where: { creatorId: user.id, date: { equals: null }, isComplete: { equals: false } },
  })
  return json(tasks)
}

export default function Backlog() {
  const tasks = useLoaderData<typeof loader>()
  const createModalProps = c.useDisclosure()
  const navigate = useNavigate()

  const setFeaturesSeen = useFeaturesSeen((s) => s.setFeaturesSeen)
  React.useEffect(() => {
    setFeaturesSeen(["backlog"])
  }, [])

  return (
    <c.Drawer isOpen={true} size="md" onClose={() => navigate("/timeline")} placement="right">
      <c.DrawerOverlay>
        <c.DrawerContent>
          <c.DrawerCloseButton />
          <c.DrawerHeader>Backlog</c.DrawerHeader>
          <c.Box px={4} overflowY="scroll" minH="100vh" pb={200} pos="relative">
            <c.Flex align="center" justify="space-between">
              <c.Button
                colorScheme="primary"
                rightIcon={<c.Box as={RiAddLine} />}
                onClick={createModalProps.onOpen}
              >
                Add
              </c.Button>
              <Modal {...createModalProps} title="Create backlog task">
                <CreateTaskForm onClose={createModalProps.onClose} />
              </Modal>
            </c.Flex>
            <c.Stack pt={2}>
              {tasks.length === 0 ? (
                <c.Center>
                  <c.Text py={4}>No tasks in the backlog!</c.Text>
                </c.Center>
              ) : (
                tasks.map((task) => <BacklogItem key={task.id} task={task} />)
              )}
            </c.Stack>
          </c.Box>
        </c.DrawerContent>
      </c.DrawerOverlay>
    </c.Drawer>
  )
}

function CreateTaskForm(props: { onClose: () => void }) {
  const { data: elements } = useQuery(
    ["task-elements"],
    async () => {
      const response = await fetch(`/api/elements`)
      if (!response.ok) throw new Error("Network response was not ok")
      return response.json() as Promise<TaskElement[]>
    },
    { keepPreviousData: true, staleTime: 10_000 },
  )

  const createFetcher = useFetcher()
  React.useEffect(() => {
    if (!createFetcher.data) return
    if (createFetcher.type === "actionReload" && createFetcher.data.task) {
      props.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFetcher.type, createFetcher.data])

  const [element, setElement] = React.useState<{ label: string; value: string; color: string } | undefined>(
    undefined,
  )
  const theme: c.Theme = c.useTheme()
  const colorMode = c.useColorMode()
  const isDark = colorMode.colorMode === "dark"
  return (
    <createFetcher.Form method="post" replace action="/api/tasks">
      <c.Stack>
        <InlineFormField
          isRequired
          autoFocus
          error={createFetcher.data?.fieldErrors?.name?.[0]}
          name="name"
          label="Name"
        />
        <input type="hidden" name="elementId" value={element?.value} />
        <InlineFormField
          isRequired
          error={createFetcher.data?.fieldErrors?.elementId?.[0]}
          label="Element"
          name="element"
          shouldPassProps={false}
          input={
            <Select
              onChange={setElement}
              formatOptionLabel={(option) => (
                <c.HStack>
                  <c.Box borderRadius="full" boxSize="16px" bg={option.color} />
                  <c.Text>{option.label}</c.Text>
                </c.HStack>
              )}
              styles={customSelectStyle(theme, false, isDark)}
              options={elements?.map((e) => ({ label: e.name, value: e.id, color: e.color }))}
              value={element}
            />
          }
        />
        <ButtonGroup>
          <c.Button onClick={props.onClose}>Cancel</c.Button>
          <c.Button
            name="_action"
            value={TasksActionMethods.AddTask}
            type="submit"
            isLoading={createFetcher.state !== "idle"}
            colorScheme="primary"
          >
            Create
          </c.Button>
        </ButtonGroup>
      </c.Stack>
    </createFetcher.Form>
  )
}

type BacklogTask = SerializeFrom<typeof loader>[0]

function BacklogItem({ task }: { task: BacklogTask }) {
  const borderColor = c.useColorModeValue("gray.100", "gray.600")
  const updateFetcher = useFetcher()

  const { addTask } = useTimelineTasks()
  React.useEffect(() => {
    if (!updateFetcher.data) return
    if (updateFetcher.type === "actionReload" && updateFetcher.data.task) {
      addTask(updateFetcher.data.task)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFetcher.type, updateFetcher.data])

  return (
    <c.Box key={task.id} border="1px solid" borderRadius="sm" borderColor={borderColor}>
      <c.Flex p={2} justify="space-between">
        <c.Text>{task.name}</c.Text>
        <c.HStack>
          <c.Popover>
            <c.PopoverTrigger>
              <TooltipIconButton
                tooltipProps={{
                  placement: "bottom",
                  zIndex: 50,
                  hasArrow: true,
                  label: "Add to timeline",
                }}
                borderRadius="full"
                size="xs"
                aria-label="add to timeline"
                icon={<c.Box as={RiAddLine} />}
              />
            </c.PopoverTrigger>
            <c.PopoverContent>
              <c.PopoverArrow />
              <c.PopoverCloseButton />
              <c.PopoverHeader>Choose a date</c.PopoverHeader>
              <c.PopoverBody>
                <updateFetcher.Form action={`/timeline/${task.id}`} replace method="post">
                  <c.Stack>
                    <c.Input type="date" name="date" defaultValue={dayjs().format("YYYY-MM-DD")} />
                    <c.Button
                      name="_action"
                      value={TaskActionMethods.UpdateTask}
                      colorScheme="primary"
                      type="submit"
                      isLoading={updateFetcher.state !== "idle"}
                    >
                      Add
                    </c.Button>
                  </c.Stack>
                </updateFetcher.Form>
              </c.PopoverBody>
            </c.PopoverContent>
          </c.Popover>

          <c.Checkbox
            size="lg"
            defaultChecked={task.isComplete}
            onChange={() =>
              updateFetcher.submit(
                { _action: TaskActionMethods.CompleteBacklogTask },
                { action: `/timeline/${task.id}`, method: "post" },
              )
            }
          />
        </c.HStack>
      </c.Flex>
      <c.Text
        px={2}
        // py={1}
        w="100%"
        fontSize="xs"
        bg={task.element.color}
        color={safeReadableColor(task.element.color)}
      >
        {task.element.name}
      </c.Text>
    </c.Box>
  )
}
