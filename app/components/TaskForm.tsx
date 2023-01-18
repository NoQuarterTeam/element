import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { RiAddLine, RiDeleteBinLine, RiFileCopyLine, RiTimeLine } from "react-icons/ri"
import { Dialog } from "@headlessui/react"
import { useFetcher, useNavigate, useSearchParams } from "@remix-run/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import { randomHexColor, safeReadableColor } from "~/lib/color"
import { useFetcherSubmit } from "~/lib/hooks/useFetcherSubmit"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { TaskActionMethods } from "~/pages/_app.timeline.$id"
import { ElementsActionMethods } from "~/pages/_app.timeline.elements"
import type { TaskElement } from "~/pages/api+/elements"
import type { TimelineTask } from "~/pages/api+/tasks"
import { TasksActionMethods } from "~/pages/api+/tasks"

import { Button } from "./ui/Button"
import { ButtonGroup } from "./ui/ButtonGroup"
import { FormButton, FormError, InlineFormField } from "./ui/Form"
import { Checkbox, Input, Textarea } from "./ui/Inputs"
import { Modal } from "./ui/Modal"
import { useDisclosure } from "~/lib/hooks/useDisclosure"
import { Singleselect } from "./ui/ReactSelect"
import { IconButton } from "./ui/IconButton"
import { BiPlus, BiTrash } from "react-icons/bi"

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
  // const existingTodos = [
  //   {
  //     id: 1,
  //     title: "Todo 1",
  //     isComplete: false,
  //   },
  //   {
  //     id: 2,
  //     title: "Todo 2",
  //     isComplete: true,
  //   },
  // ]

  const [todos, setTodos] = React.useState(task?.todos || [])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const day = searchParams.get("day") || undefined
  const { addTask, updateTask, removeTask } = useTimelineTasks()

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
    deleteSubmit.submit({ _action: TaskActionMethods.DeleteTask }, { method: "delete", action: `/timeline/${task.id}` })
  }

  const duplicateSubmit = useFetcher()
  const handleDuplicate = () => {
    if (!task) return
    duplicateSubmit.submit({ _action: TaskActionMethods.DuplicateTask }, { method: "post", action: `/timeline/${task.id}` })
  }
  const addToBacklogSubmit = useFetcher()
  const handleToBacklog = () => {
    if (!task) return
    addToBacklogSubmit.submit({ _action: TaskActionMethods.AddToBacklog }, { method: "post", action: `/timeline/${task.id}` })
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
    task?.element ? { value: task.element.id, label: task.element.name, color: task.element.color } : undefined,
  )
  const elementModalProps = useDisclosure()

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

  const itemsRef = React.useRef<(HTMLInputElement | null)[]>([])
  React.useEffect(() => {
    itemsRef.current = itemsRef.current.slice(0, todos.length)
  }, [todos])

  return (
    <>
      <Dialog open={true} as="div" className="relative z-50" onClose={() => navigate("/timeline")}>
        <div className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full flex-col items-center justify-start p-0 sm:p-4">
            <Dialog.Panel className="mt-10 w-full max-w-xl overflow-hidden bg-white text-left shadow-xl transition-all dark:bg-gray-700">
              <createUpdateFetcher.Form replace method="post" action={task ? `/timeline/${task.id}` : "/api/tasks"}>
                <div className="flex w-full items-start justify-between">
                  <input
                    className="w-full border-none bg-transparent py-3 pl-4 pr-8 text-2xl text-gray-900 focus:outline-none dark:text-gray-100 md:py-4 md:text-4xl"
                    required
                    name="name"
                    placeholder="Name"
                    defaultValue={task?.name}
                    autoFocus
                  />
                  <div className="p-3 sm:p-4">
                    <Checkbox defaultChecked={task?.isComplete} name="isComplete" className="sq-6" />
                  </div>
                </div>
                <div className="stack space-y-1 p-4 pt-0 md:space-y-3">
                  <input type="hidden" name="elementId" value={element?.value} />

                  <div className="flex w-full items-end md:items-start">
                    <InlineFormField
                      required
                      label="Element"
                      name="element"
                      error={createUpdateFetcher.data?.fieldErrors?.elementId?.[0]}
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
                    <Button
                      className="ml-2"
                      onClick={elementModalProps.onOpen}
                      variant="outline"
                      leftIcon={<RiAddLine className="sq-4" />}
                    >
                      Create
                    </Button>
                  </div>

                  <InlineFormField
                    type="date"
                    name="date"
                    required
                    defaultValue={day || (task ? dayjs(task.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"))}
                    label="Date"
                    error={createUpdateFetcher.data?.fieldErrors?.date?.[0]}
                  />

                  <InlineFormField
                    name="durationHours"
                    label="Duration"
                    shouldPassProps={false}
                    error={
                      createUpdateFetcher.data?.fieldErrors?.durationHours?.[0] ||
                      createUpdateFetcher.data?.fieldErrors?.durationMinutes?.[0]
                    }
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
                    input={<Textarea rows={4} />}
                    error={createUpdateFetcher.data?.fieldErrors?.description?.[0]}
                  />
                  <InlineFormField
                    name="todos"
                    label="Todos"
                    shouldPassProps={false}
                    input={
                      <div className="w-full">
                        {todos.map((todo, i) => (
                          <div key={todo.id} className="flex items-center space-x-1">
                            <Checkbox name={`todos[${i}].isComplete`} defaultChecked={todos[i]?.isComplete} />
                            <Input
                              id={`todo-${todo.id}`}
                              ref={(el) => (itemsRef.current[i] = el)}
                              name={`todos[${i}].title`}
                              defaultValue={todos[i]?.title}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  const newTodos = [...todos]
                                  newTodos.splice(i + 1, 0, { id: new Date().toISOString(), title: "", isComplete: false })
                                  setTodos(newTodos)
                                  requestAnimationFrame(() => {
                                    const nextInput = itemsRef.current?.[i + 1]
                                    nextInput?.focus()
                                  })
                                }
                                if (e.key === "ArrowUp") {
                                  const nextInput = itemsRef.current?.[i - 1]
                                  nextInput?.select()
                                }
                                if (e.key === "ArrowDown") {
                                  const nextInput = itemsRef.current?.[i + 1]
                                  nextInput?.select()
                                }
                                if (e.key === "Backspace" && !e.currentTarget.value) {
                                  e.preventDefault()
                                  setTodos((c) => c.filter((t) => t.id !== todo.id))
                                  requestAnimationFrame(() => {
                                    const nextInput = itemsRef.current?.[i - 1]
                                    nextInput?.focus()
                                  })
                                }
                              }}
                            />

                            <IconButton
                              variant="ghost"
                              icon={<BiTrash />}
                              aria-label="remove todo"
                              onClick={() => setTodos((t) => t.filter((t) => t.id !== todo.id))}
                            />
                          </div>
                        ))}
                        <IconButton
                          icon={<BiPlus />}
                          aria-label="add todo"
                          onClick={() => setTodos((c) => [...c, { id: new Date().toISOString(), title: "", isComplete: false }])}
                        />
                      </div>
                    }
                  />

                  <FormError error={createUpdateFetcher.data?.formError} />

                  <ButtonGroup>
                    <Button variant="ghost" onClick={() => navigate("/timeline")}>
                      Cancel
                    </Button>
                    <FormButton
                      name="_action"
                      value={task ? TaskActionMethods.UpdateTask : TasksActionMethods.AddTask}
                      isLoading={createUpdateFetcher.state !== "idle"}
                    >
                      {task ? "Update" : "Create"}
                    </FormButton>
                  </ButtonGroup>
                  {task && (
                    <>
                      <hr />
                      <div className="center">
                        <div className="hstack space-x-0">
                          <Button
                            variant="ghost"
                            leftIcon={<RiDeleteBinLine />}
                            colorScheme="red"
                            onClick={handleDelete}
                            isLoading={deleteSubmit.state !== "idle"}
                          >
                            <span className="hidden md:block">Delete</span>
                          </Button>
                          <Button
                            variant="ghost"
                            leftIcon={<RiFileCopyLine />}
                            onClick={handleDuplicate}
                            isLoading={duplicateSubmit.state !== "idle"}
                          >
                            <span className="hidden md:block">Duplicate</span>
                          </Button>
                          <Button
                            variant="ghost"
                            leftIcon={<RiTimeLine />}
                            onClick={handleToBacklog}
                            isLoading={addToBacklogSubmit.state !== "idle"}
                          >
                            <span className="hidden md:block">Add to backlog</span>
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </createUpdateFetcher.Form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
      <Modal title="Create an Element" {...elementModalProps}>
        <createElementFetcher.Form replace method="post" action="/timeline/elements">
          <div className="stack p-4">
            <InlineFormField
              autoFocus
              name="name"
              label="Name"
              size="sm"
              required
              error={createElementFetcher.data?.fieldErrors?.name?.[0]}
            />
            <input type="hidden" name="color" value={color} />
            <InlineFormField
              name="color"
              required
              error={createElementFetcher.data?.fieldErrors?.color?.[0]}
              label="Color"
              input={
                <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2">
                  <div className="flex w-full">
                    <HexColorPicker color={color} onChange={setColor} />
                  </div>
                  <div className="center w-full justify-start md:justify-center">
                    <div className="center h-full w-full rounded-lg p-4 px-6" style={{ background: color }}>
                      <p className="w-full text-center" style={{ color: safeReadableColor(color) }}>
                        {color}
                      </p>
                    </div>
                  </div>
                </div>
              }
            />

            <ButtonGroup>
              <Button variant="ghost" disabled={createElementFetcher.state !== "idle"} onClick={elementModalProps.onClose}>
                Cancel
              </Button>
              <Button
                name="_action"
                value={ElementsActionMethods.CreateElement}
                type="submit"
                colorScheme="primary"
                isLoading={createElementFetcher.state !== "idle"}
              >
                Create
              </Button>
            </ButtonGroup>
          </div>
        </createElementFetcher.Form>
      </Modal>
    </>
  )
})
