import * as React from "react"
import { BiPlus, BiTrash } from "react-icons/bi"
import { lazyWithPreload } from "react-lazy-with-preload"
import * as c from "@chakra-ui/react"
import { useFetcher } from "@remix-run/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { ClientOnly } from "remix-utils"

import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { ElementsActionMethods } from "~/pages/api.elements"
import type { TaskElement } from "~/pages/api.task-elements"
import type { TimelineTask } from "~/pages/api.tasks"
import { TasksActionMethods } from "~/pages/api.tasks"
import { TaskActionMethods } from "~/pages/api.tasks.$id"

import { ButtonGroup } from "./ButtonGroup"
import { FormButton, FormError, InlineFormField } from "./Form"
import { Modal } from "./Modal"

export const PreloadedEditorInput = lazyWithPreload(() => import("./EditorInput"))

type FieldErrors = {
  [Property in keyof TimelineTask]: string[]
} & { elementId: string[] }

interface FormProps {
  onClose: () => void
  day?: string
  task?: TimelineTask
}
type CreateUpdateRes = {
  task?: TimelineTask
  formError?: string
  fieldErrors?: FieldErrors
}
export function TaskForm({ day, onClose, task }: FormProps) {
  const { addTask, updateTask, removeTask } = useTimelineTasks((state) => ({
    addTask: state.addTask,
    updateTask: state.updateTask,
    removeTask: state.removeTask,
  }))

  const createUpdateFetcher = useFetcher<CreateUpdateRes>()
  React.useEffect(() => {
    if (!createUpdateFetcher.data) return
    if (createUpdateFetcher.data.task) {
      if (task) {
        updateTask(createUpdateFetcher.data.task)
      } else {
        addTask(createUpdateFetcher.data.task)
      }
      onClose()
    }
  }, [createUpdateFetcher.data, onClose, addTask, updateTask, task])

  const deleteSubmit = useFetcher()
  const handleDelete = () => {
    if (!task) return
    deleteSubmit.submit(
      { _action: TaskActionMethods.DeleteTask },
      { method: "delete", action: `/api/tasks/${task.id}` },
    )
  }
  React.useEffect(() => {
    if (!task) return
    if (deleteSubmit.type === "actionReload" && deleteSubmit.data?.success) {
      onClose()
      removeTask(task)
    }
  }, [task, deleteSubmit.data, onClose, removeTask, deleteSubmit.type])

  const { data } = useQuery(["task-elements"], async () => {
    const response = await fetch(`/api/task-elements`)
    if (!response.ok) throw new Error("Network response was not ok")
    return response.json() as Promise<{ elements: TaskElement[] }>
  })
  const elements = data?.elements

  const [elementId, setElementId] = React.useState<string | undefined>(task?.element.id)
  const elementModalProps = c.useDisclosure()

  const client = useQueryClient()
  const createElementFetcher = useFetcher()

  React.useEffect(() => {
    if (createElementFetcher.type === "actionReload" && createElementFetcher.data?.element) {
      const taskElements = client.getQueryData<{ elements: Element[] }>(["task-elements"])
      client.setQueryData(["task-elements"], {
        elements: [createElementFetcher.data.element, ...(taskElements?.elements || [])],
      })
      elementModalProps.onClose()
      setElementId(createElementFetcher.data.element.id)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createElementFetcher.data, createElementFetcher.type])

  if (!elements) return <c.Center h="379px" />

  return (
    <>
      <createUpdateFetcher.Form replace method="post" action={task ? `/api/tasks/${task.id}` : "/api/tasks"}>
        <c.Stack spacing={3}>
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
              fontSize="4xl"
              minH="70px"
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

          <c.Flex align="center">
            <InlineFormField
              isRequired
              name="elementId"
              label="Element"
              value={elementId || ""}
              onChange={(e) => setElementId(e.target.value)}
              error={createUpdateFetcher.data?.fieldErrors?.elementId?.[0]}
              input={
                <c.Select>
                  <option value="">Select an element</option>
                  {elements.map((element) => (
                    <option key={element.id} value={element.id}>
                      {element.name}
                    </option>
                  ))}
                </c.Select>
              }
            />
            <c.Button
              ml={2}
              pr={4}
              onClick={elementModalProps.onOpen}
              size="sm"
              variant="outline"
              leftIcon={<c.Box as={BiPlus} boxSize="16px" mr={-2} />}
            >
              Create
            </c.Button>
          </c.Flex>

          <InlineFormField
            type="date"
            name="date"
            isRequired
            defaultValue={day || (task ? dayjs(task.date).format("YYYY-MM-DD") : new Date())}
            label="Date"
            error={createUpdateFetcher.data?.fieldErrors?.date?.[0]}
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
          <c.Flex align="center" justify="space-between">
            {task ? (
              <c.Button
                variant="ghost"
                leftIcon={<c.Box as={BiTrash} />}
                colorScheme="red"
                onClick={handleDelete}
                isLoading={deleteSubmit.state === "submitting"}
                isDisabled={deleteSubmit.state === "submitting"}
              >
                Delete
              </c.Button>
            ) : (
              <c.Box />
            )}

            <ButtonGroup>
              <c.Button variant="ghost" onClick={onClose}>
                Cancel
              </c.Button>
              <FormButton
                colorScheme="orange"
                name="_action"
                value={task ? TaskActionMethods.UpdateTask : TasksActionMethods.AddTask}
                isLoading={createUpdateFetcher.state === "submitting"}
                isDisabled={createUpdateFetcher.state === "submitting"}
              >
                {task ? "Update" : "Create"}
              </FormButton>
            </ButtonGroup>
          </c.Flex>
        </c.Stack>
      </createUpdateFetcher.Form>
      <Modal title="Create an Element" {...elementModalProps}>
        <createElementFetcher.Form replace method="post" action="/api/elements">
          <c.Stack spacing={4}>
            <InlineFormField
              autoFocus
              name="name"
              label="Name"
              size="sm"
              isRequired
              error={createElementFetcher.data?.fieldErrors?.name?.[0]}
            />
            <InlineFormField
              name="color"
              label="Color"
              size="sm"
              error={createElementFetcher.data?.fieldErrors?.color?.[0]}
            />
            <ButtonGroup>
              <c.Button
                variant="ghost"
                isDisabled={createElementFetcher.state === "submitting"}
                onClick={elementModalProps.onClose}
              >
                Cancel
              </c.Button>
              <c.Button
                name="_action"
                value={ElementsActionMethods.CreateElement}
                type="submit"
                colorScheme="orange"
                isLoading={createElementFetcher.state === "submitting"}
                isDisabled={createElementFetcher.state === "submitting"}
              >
                Create
              </c.Button>
            </ButtonGroup>
          </c.Stack>
        </createElementFetcher.Form>
      </Modal>
    </>
  )
}
