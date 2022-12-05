import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { RiAddLine, RiDeleteBinLine, RiFileCopyLine, RiTimeLine } from "react-icons/ri"
import { lazyWithPreload } from "react-lazy-with-preload"
import Select from "react-select"
import * as c from "@chakra-ui/react"
import { useFetcher, useNavigate, useSearchParams } from "@remix-run/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { ClientOnly } from "remix-utils"

import { randomHexColor, safeReadableColor } from "~/lib/color"
import { useFetcherSubmit } from "~/lib/hooks/useFetcherSubmit"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { customSelectStyle } from "~/lib/styles/react-select"
import { TaskActionMethods } from "~/pages/_app.timeline.$id"
import { ElementsActionMethods } from "~/pages/_app.timeline.elements"
import type { TaskElement } from "~/pages/api.elements"
import type { TimelineTask } from "~/pages/api.tasks"
import { TasksActionMethods } from "~/pages/api.tasks"

import { ButtonGroup } from "./ButtonGroup"
import { FormButton, FormError, InlineFormField } from "./Form"
import { Modal } from "./Modal"

export const PreloadedEditorInput = lazyWithPreload(() => import("./EditorInput"))

type FieldErrors = {
  [Property in keyof TimelineTask]: string[]
} & { elementId: string[] }

interface FormProps {
  task?: TimelineTask
}
type CreateUpdateRes = {
  task?: TimelineTask
  formError?: string
  fieldErrors?: FieldErrors
}
export const TaskForm = React.memo(function _TaskForm({ task }: FormProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const day = searchParams.get("day") || undefined
  const { addTask, updateTask, removeTask } = useTimelineTasks()
  const theme: c.Theme = c.useTheme()
  const { colorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  const [color, setColor] = React.useState(randomHexColor())

  const createUpdateFetcher = useFetcher<CreateUpdateRes>()
  React.useEffect(() => {
    if (!createUpdateFetcher.data) return
    if (createUpdateFetcher.type === "actionReload" && createUpdateFetcher.data.task) {
      navigate("/timeline")
      if (task) {
        updateTask(createUpdateFetcher.data.task)
      } else {
        addTask(createUpdateFetcher.data.task)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createUpdateFetcher.type, createUpdateFetcher.data, task])

  const deleteSubmit = useFetcherSubmit<{ success: boolean }>({
    onSuccess: (data) => {
      if (data.success && task) {
        removeTask(task)
        navigate("/timeline")
      }
    },
  })
  const handleDelete = () => {
    if (!task) return
    deleteSubmit.submit(
      { _action: TaskActionMethods.DeleteTask },
      { method: "delete", action: `/timeline/${task.id}` },
    )
  }

  const duplicateSubmit = useFetcher()
  const handleDuplicate = () => {
    if (!task) return
    duplicateSubmit.submit(
      { _action: TaskActionMethods.DuplicateTask },
      { method: "post", action: `/timeline/${task.id}` },
    )
  }
  const addToBacklogSubmit = useFetcher()
  const handleToBacklog = () => {
    if (!task) return
    addToBacklogSubmit.submit(
      { _action: TaskActionMethods.AddToBacklog },
      { method: "post", action: `/timeline/${task.id}` },
    )
  }
  React.useEffect(() => {
    if (!task) return
    if (addToBacklogSubmit.type === "actionReload" && addToBacklogSubmit.data?.task) {
      navigate("/timeline")
      removeTask(task)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, addToBacklogSubmit.data, addToBacklogSubmit.type])

  React.useEffect(() => {
    if (duplicateSubmit.type === "actionReload" && duplicateSubmit.data?.task) {
      navigate("/timeline")
      addTask(duplicateSubmit.data.task)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateSubmit.data, addTask, duplicateSubmit.type])

  const { data: elements } = useQuery(
    ["task-elements"],
    async () => {
      const response = await fetch(`/api/elements`)
      if (!response.ok) throw new Error("Network response was not ok")
      return response.json() as Promise<TaskElement[]>
    },
    { keepPreviousData: true, staleTime: 10_000 },
  )

  const [element, setElement] = React.useState(
    task?.element
      ? { value: task.element.id, label: task.element.name, color: task.element.color }
      : undefined,
  )
  const elementModalProps = c.useDisclosure()

  const client = useQueryClient()
  const createElementFetcher = useFetcher()

  React.useEffect(() => {
    if (createElementFetcher.type === "actionReload" && createElementFetcher.data?.element) {
      const taskElements = client.getQueryData<Element[]>(["task-elements"])
      client.setQueryData(["task-elements"], [createElementFetcher.data.element, ...(taskElements || [])])
      elementModalProps.onClose()
      setElement({
        label: createElementFetcher.data.element.name,
        value: createElementFetcher.data.element.id,
        color: createElementFetcher.data.element.color,
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createElementFetcher.data, createElementFetcher.type])

  if (!elements) return <c.Center h="379px" />

  return (
    <>
      <c.Modal isOpen onClose={() => navigate("/timeline")} size="xl" trapFocus={false}>
        <c.ModalOverlay />
        <c.ModalContent minH="400px" overflowY="scroll">
          <c.ModalBody mb={2} px={{ base: 3, md: 4 }}>
            <React.Suspense>
              <createUpdateFetcher.Form
                replace
                method="post"
                action={task ? `/timeline/${task.id}` : "/api/tasks"}
              >
                <c.Stack spacing={{ base: 1, md: 3 }}>
                  <c.Flex w="100%" align="flex-start" justify="space-between">
                    <c.Input
                      name="name"
                      placeholder="Name"
                      w="95%"
                      isRequired
                      defaultValue={task?.name}
                      isInvalid={!!createUpdateFetcher.data?.fieldErrors?.name?.[0]}
                      autoFocus
                      size="lg"
                      fontSize={{ base: "2xl", md: "4xl" }}
                      minH={{ base: "60px", md: "70px" }}
                      pr={2}
                      pl={4}
                      ml={-4}
                      focusBorderColor="transparent"
                      border="none!important"
                      bg="transparent"
                    />
                    <c.Box pt={2}>
                      <c.Checkbox
                        tabIndex={1}
                        type="checkbox"
                        size="lg"
                        defaultChecked={task?.isComplete}
                        name="isComplete"
                      />
                    </c.Box>
                  </c.Flex>
                  <input type="hidden" name="elementId" value={element?.value} />
                  <c.Flex align={{ base: "flex-end", md: "flex-start" }}>
                    <InlineFormField
                      isRequired
                      label="Element"
                      name="element"
                      error={createUpdateFetcher.data?.fieldErrors?.elementId?.[0]}
                      input={
                        <Select
                          value={element || ""}
                          onChange={setElement}
                          formatOptionLabel={(option) => (
                            <c.HStack>
                              <c.Box borderRadius="full" boxSize="16px" bg={option.color} />
                              <c.Text>{option.label}</c.Text>
                            </c.HStack>
                          )}
                          styles={customSelectStyle(
                            theme,
                            !!createUpdateFetcher.data?.fieldErrors?.elementId?.[0],
                            isDark,
                          )}
                          options={elements.map((e) => ({ label: e.name, value: e.id, color: e.color }))}
                        />
                      }
                    />
                    <c.Button
                      ml={2}
                      pr={4}
                      onClick={elementModalProps.onOpen}
                      size="sm"
                      variant="outline"
                      leftIcon={<c.Box as={RiAddLine} boxSize="16px" mr={-2} />}
                    >
                      Create
                    </c.Button>
                  </c.Flex>

                  <InlineFormField
                    type="date"
                    name="date"
                    isRequired
                    defaultValue={
                      day || (task ? dayjs(task.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"))
                    }
                    label="Date"
                    error={createUpdateFetcher.data?.fieldErrors?.date?.[0]}
                  />

                  <c.Box>
                    <c.Flex flexDir={{ base: "column", md: "row" }}>
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
                      {createUpdateFetcher.data?.fieldErrors?.durationHours?.[0] ||
                        createUpdateFetcher.data?.fieldErrors?.durationMinutes?.[0]}
                    </c.FormErrorMessage>
                  </c.Box>
                  <InlineFormField
                    pattern="^([01]\d|2[0-3]):?([0-5]\d)$"
                    type="time"
                    name="startTime"
                    defaultValue={task?.startTime}
                    label="Start time"
                    error={createUpdateFetcher.data?.fieldErrors?.startTime?.[0]}
                  />
                  <InlineFormField
                    name="description"
                    defaultValue={task?.description}
                    label="Description"
                    input={
                      <c.Box minH="250px" w="100%">
                        <ClientOnly fallback={<c.Box h="250px" />}>
                          {() => <PreloadedEditorInput name="description" defaultValue={task?.description} />}
                        </ClientOnly>
                      </c.Box>
                    }
                    error={createUpdateFetcher.data?.fieldErrors?.description?.[0]}
                  />

                  <FormError error={createUpdateFetcher.data?.formError} />

                  <ButtonGroup>
                    <c.Button variant="ghost" onClick={() => navigate("/timeline")}>
                      Cancel
                    </c.Button>
                    <FormButton
                      colorScheme="primary"
                      name="_action"
                      value={task ? TaskActionMethods.UpdateTask : TasksActionMethods.AddTask}
                      isLoading={createUpdateFetcher.state !== "idle"}
                    >
                      {task ? "Update" : "Create"}
                    </FormButton>
                  </ButtonGroup>
                  {task && (
                    <>
                      <c.Divider />
                      <c.Center>
                        <c.HStack spacing={0}>
                          <c.Button
                            variant="ghost"
                            leftIcon={<c.Box as={RiDeleteBinLine} />}
                            colorScheme="red"
                            onClick={handleDelete}
                            isLoading={deleteSubmit.state !== "idle"}
                          >
                            <c.Text as="span" display={{ base: "none", md: "block" }}>
                              Delete
                            </c.Text>
                          </c.Button>
                          <c.Button
                            variant="ghost"
                            leftIcon={<c.Box as={RiFileCopyLine} />}
                            onClick={handleDuplicate}
                            isLoading={duplicateSubmit.state !== "idle"}
                          >
                            <c.Text as="span" display={{ base: "none", md: "block" }}>
                              Duplicate
                            </c.Text>
                          </c.Button>
                          <c.Button
                            variant="ghost"
                            leftIcon={<c.Box as={RiTimeLine} />}
                            onClick={handleToBacklog}
                            isLoading={addToBacklogSubmit.state !== "idle"}
                          >
                            <c.Text as="span" display={{ base: "none", md: "block" }}>
                              Add to backlog
                            </c.Text>
                          </c.Button>
                        </c.HStack>
                      </c.Center>
                    </>
                  )}
                </c.Stack>
              </createUpdateFetcher.Form>
            </React.Suspense>
          </c.ModalBody>
        </c.ModalContent>
      </c.Modal>
      <Modal title="Create an Element" size="xl" {...elementModalProps}>
        <createElementFetcher.Form replace method="post" action="/timeline/elements">
          <c.Stack spacing={4}>
            <InlineFormField
              autoFocus
              name="name"
              label="Name"
              size="sm"
              isRequired
              error={createElementFetcher.data?.fieldErrors?.name?.[0]}
            />
            <c.Input type="hidden" name="color" value={color} />
            <InlineFormField
              name="color"
              isRequired
              error={createElementFetcher.data?.fieldErrors?.color?.[0]}
              label="Color"
              input={
                <c.SimpleGrid w="100%" columns={{ base: 1, md: 2 }} spacing={1}>
                  <c.Flex w="100%">
                    <HexColorPicker color={color} onChange={setColor} />
                  </c.Flex>
                  <c.Center w="100%" justifyContent={{ base: "flex-start", md: "center" }}>
                    <c.Center bg={color} maxW="200px" w="100%" h="100%" p={4} px={6} borderRadius="lg">
                      <c.Text textAlign="center" w="100%" color={safeReadableColor(color)}>
                        {color}
                      </c.Text>
                    </c.Center>
                  </c.Center>
                </c.SimpleGrid>
              }
            />

            <ButtonGroup>
              <c.Button
                variant="ghost"
                isDisabled={createElementFetcher.state !== "idle"}
                onClick={elementModalProps.onClose}
              >
                Cancel
              </c.Button>
              <c.Button
                name="_action"
                value={ElementsActionMethods.CreateElement}
                type="submit"
                colorScheme="primary"
                isLoading={createElementFetcher.state !== "idle"}
              >
                Create
              </c.Button>
            </ButtonGroup>
          </c.Stack>
        </createElementFetcher.Form>
      </Modal>
    </>
  )
})
