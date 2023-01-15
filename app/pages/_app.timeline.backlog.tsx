import * as React from "react"
import { RiAddLine, RiDeleteBinLine, RiEditLine } from "react-icons/ri"
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons"
import * as c from "@chakra-ui/react"
import { type LoaderArgs, type SerializeFrom, json } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"

import { TooltipIconButton } from "~/components/TooltipIconButton"
import { ButtonGroup } from "~/components/ui/ButtonGroup"
import { FormButton, InlineFormField } from "~/components/ui/Form"
import { Textarea } from "~/components/ui/Inputs"
import { Singleselect } from "~/components/ui/ReactSelect"
import { safeReadableColor } from "~/lib/color"
import { db } from "~/lib/db.server"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useFetcherSubmit } from "~/lib/hooks/useFetcherSubmit"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { TaskActionMethods } from "~/pages/_app.timeline.$id"
import { type TaskElement } from "~/pages/api+/elements"
import { type TimelineTask, TasksActionMethods } from "~/pages/api+/tasks"
import { requireUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
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
              <c.Button colorScheme="primary" rightIcon={<c.Box as={RiAddLine} />} onClick={createModalProps.onOpen}>
                Add
              </c.Button>

              <BacklogTaskForm {...createModalProps} />
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

function BacklogTaskForm({ task, ...createModalProps }: { task?: BacklogTask } & Omit<c.ModalProps, "children">) {
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
    <c.Modal size="xl" {...createModalProps}>
      <c.ModalOverlay>
        <c.ModalContent minH="400px" overflowY="scroll">
          <c.ModalBody mb={2}>
            <React.Suspense>
              <taskFetcher.Form method="post" replace action={task ? `/timeline/${task.id}` : "/api/tasks"}>
                <c.Stack>
                  <input
                    className="-ml-4 min-h-[60px] w-[95%] border-none bg-transparent pl-4 pr-2 text-2xl text-gray-900 focus:outline-none dark:text-gray-100 md:min-h-[70px] md:text-4xl"
                    required
                    name="name"
                    placeholder="Name"
                    defaultValue={task?.name}
                    autoFocus
                  />

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
                  <c.Box>
                    <c.Flex>
                      <c.FormLabel htmlFor="durationHours" fontSize="sm" minW={{ base: "80px", md: "100px" }}>
                        Duration
                      </c.FormLabel>
                      <c.HStack>
                        <c.HStack spacing={1}>
                          <c.Input
                            textAlign="center"
                            px={0}
                            defaultValue={task?.durationHours ? task.durationHours.toString() : undefined}
                            id="durationHours"
                            min={0}
                            max={24}
                            boxSize="30px"
                            name="durationHours"
                          />
                          <c.Text fontSize="xs" opacity={0.8}>
                            Hours
                          </c.Text>
                        </c.HStack>
                        <c.HStack spacing={1}>
                          <c.Input
                            defaultValue={task?.durationMinutes ? task.durationMinutes.toString() : undefined}
                            max={60}
                            textAlign="center"
                            px={0}
                            min={0}
                            boxSize="30px"
                            name="durationMinutes"
                          />
                          <c.Text fontSize="xs" opacity={0.8}>
                            Minutes
                          </c.Text>
                        </c.HStack>
                      </c.HStack>
                    </c.Flex>
                    <c.FormErrorMessage>
                      {taskFetcher.data?.fieldErrors?.durationHours?.[0] || taskFetcher.data?.fieldErrors?.durationMinutes?.[0]}
                    </c.FormErrorMessage>
                  </c.Box>
                  <InlineFormField
                    name="description"
                    defaultValue={task?.description}
                    label="Description"
                    input={<Textarea rows={6} />}
                    error={taskFetcher.data?.fieldErrors?.description?.[0]}
                  />
                  <ButtonGroup>
                    <c.Button variant="ghost" onClick={createModalProps.onClose}>
                      Cancel
                    </c.Button>
                    <FormButton
                      colorScheme="primary"
                      name="_action"
                      value={task ? TaskActionMethods.UpdateTask : TasksActionMethods.AddTask}
                      isLoading={taskFetcher.state !== "idle"}
                    >
                      {task ? "Update" : "Create"}
                    </FormButton>
                  </ButtonGroup>
                </c.Stack>
              </taskFetcher.Form>
            </React.Suspense>
          </c.ModalBody>
        </c.ModalContent>
      </c.ModalOverlay>
    </c.Modal>
  )
}

type BacklogTask = SerializeFrom<typeof loader>[0]

function BacklogItem({ task }: { task: BacklogTask }) {
  const editModalProps = c.useDisclosure()
  const borderColor = c.useColorModeValue("gray.100", "gray.600")
  const bg = c.useColorModeValue("gray.50", "gray.800")
  const { isOpen, onToggle } = c.useDisclosure()
  const { addTask } = useTimelineTasks()

  const updateFetcher = useFetcherSubmit<{ task: TimelineTask }>({ onSuccess: (data) => addTask(data.task) })

  const deleteFetcher = useFetcher()
  return (
    <c.Box key={task.id} border="1px solid" borderRadius="sm" borderColor={borderColor}>
      <c.Flex p={2} justify="space-between" align="flex-start">
        <c.Text>{task.name}</c.Text>

        <c.HStack>
          {task.description && (
            <TooltipIconButton
              variant="outline"
              tooltipProps={{
                placement: "bottom",
                zIndex: 50,
                hasArrow: true,
                label: "Show description",
              }}
              onClick={onToggle}
              borderRadius="full"
              size="xs"
              aria-label="show description"
              icon={<c.Box as={isOpen ? ChevronUpIcon : ChevronDownIcon} />}
            />
          )}

          <TooltipIconButton
            variant="outline"
            tooltipProps={{
              placement: "bottom",
              zIndex: 50,
              hasArrow: true,
              label: "Edit",
            }}
            onClick={editModalProps.onOpen}
            borderRadius="full"
            size="xs"
            aria-label="edit"
            icon={<c.Box as={RiEditLine} />}
          />
          <TooltipIconButton
            variant="outline"
            tooltipProps={{
              placement: "bottom",
              zIndex: 50,
              hasArrow: true,
              label: "Delete",
            }}
            onClick={() => {
              deleteFetcher.submit({ _action: TaskActionMethods.DeleteTask }, { action: `/timeline/${task.id}`, method: "post" })
            }}
            borderRadius="full"
            size="xs"
            aria-label="delete"
            icon={<c.Box as={RiDeleteBinLine} />}
          />
          <BacklogTaskForm task={task} {...editModalProps} />

          <c.Popover isLazy>
            <c.PopoverTrigger>
              <TooltipIconButton
                variant="outline"
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
      {task.description && (
        <c.Collapse in={isOpen} animateOpacity>
          <c.Box p={2} pt={0}>
            <c.Text
              borderRadius="sm"
              sx={{ ul: { my: 0, pl: 4 }, ol: { ml: 4, my: 0 } }}
              bg={bg}
              p={2}
              w="100%"
              fontSize="sm"
              dangerouslySetInnerHTML={{ __html: task.description }}
            />
          </c.Box>
        </c.Collapse>
      )}

      <c.Text px={2} w="100%" fontSize="xs" bg={task.element.color} color={safeReadableColor(task.element.color)}>
        {task.element.name}
      </c.Text>
    </c.Box>
  )
}
