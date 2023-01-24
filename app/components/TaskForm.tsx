import * as React from "react"
import { BiDotsVertical, BiPlus } from "react-icons/bi"
import { HiOutlineExclamation } from "react-icons/hi"
import { RiAddLine, RiDeleteBinLine, RiFileCopyLine, RiTimeLine } from "react-icons/ri"
import { Dialog } from "@headlessui/react"
import { type Element } from "@prisma/client"
import { useNavigate, useSearchParams } from "@remix-run/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import { randomHexColor } from "~/lib/color"
import { useDisclosure } from "~/lib/hooks/useDisclosure"
import { useFetcherSubmit } from "~/lib/hooks/useFetcherSubmit"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { join } from "~/lib/tailwind"
import { type TaskDetail, TaskActionMethods } from "~/pages/_app.timeline.$id"
import { ElementsActionMethods } from "~/pages/_app.timeline.elements"
import type { TaskElement } from "~/pages/api+/elements"
import type { TimelineTask } from "~/pages/api+/tasks"
import { TasksActionMethods } from "~/pages/api+/tasks"

import { ColorInput } from "./ColorInput"
import { Button } from "./ui/Button"
import { ButtonGroup } from "./ui/ButtonGroup"
import { FormButton, FormError, InlineFormField } from "./ui/Form"
import { IconButton } from "./ui/IconButton"
import { Checkbox, Input, Textarea } from "./ui/Inputs"
import { Menu, MenuButton, MenuItem, MenuList } from "./ui/Menu"
import { Modal } from "./ui/Modal"
import { Singleselect } from "./ui/ReactSelect"

type FieldErrors = {
  [Property in keyof TimelineTask]: string[]
} & { elementId: string[] }

interface FormProps {
  task?: TaskDetail
}
type CreateUpdateRes = {
  task?: TaskDetail
  formError?: string
  fieldErrors?: FieldErrors
}
export const TaskForm = React.memo(function _TaskForm({ task }: FormProps) {
  const [todos, setTodos] = React.useState(task?.todos || [])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const day = searchParams.get("day") || undefined
  const { addTask, updateTask, removeTask } = useTimelineTasks()
  const [isImportant, setIsImportant] = React.useState(task?.isImportant || false)
  const [color, setColor] = React.useState(randomHexColor())

  const createUpdateFetcher = useFetcherSubmit<CreateUpdateRes>({
    onSuccess: ({ task: createUpdateTask }) => {
      if (!createUpdateTask) return
      if (task) {
        updateTask(createUpdateTask)
      } else {
        addTask(createUpdateTask)
      }
      requestAnimationFrame(() => navigate("/timeline"))
    },
  })

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

  const duplicateSubmit = useFetcherSubmit<{ task: TimelineTask }>({
    onSuccess: ({ task: dupeTask }) => {
      if (!dupeTask) return
      addTask(dupeTask)
      requestAnimationFrame(() => navigate("/timeline"))
    },
  })
  const handleDuplicate = () => {
    if (!task) return
    duplicateSubmit.submit({ _action: TaskActionMethods.DuplicateTask }, { method: "post", action: `/timeline/${task.id}` })
  }

  const addToBacklogSubmit = useFetcherSubmit<{ task: TimelineTask }>({
    onSuccess: ({ task: backlogTask }) => {
      if (!backlogTask) return
      removeTask(backlogTask)
      requestAnimationFrame(() => navigate("/timeline"))
    },
  })
  const handleToBacklog = () => {
    if (!task) return
    addToBacklogSubmit.submit({ _action: TaskActionMethods.AddToBacklog }, { method: "post", action: `/timeline/${task.id}` })
  }

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
  const createElementFetcher = useFetcherSubmit<{ element: Element }>({
    onSuccess: ({ element: createdElement }) => {
      if (!createdElement) return
      const taskElements = client.getQueryData<Element[]>(["task-elements"])
      client.setQueryData(["task-elements"], [createdElement, ...(taskElements || [])])
      elementModalProps.onClose()
      setElement({
        label: createdElement.name,
        value: createdElement.id,
        color: createdElement.color,
      })
    },
  })

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
                    className="w-full border-none bg-transparent pl-3 pt-3 pb-1 text-2xl text-gray-900 focus:outline-none dark:text-gray-100 md:pt-5 md:pl-5 md:text-4xl"
                    required
                    name="name"
                    placeholder="Name"
                    defaultValue={task?.name}
                    autoFocus
                  />
                  <div className="flex justify-end space-x-1 p-3 md:p-5">
                    <Button
                      colorScheme={isImportant ? "primary" : "gray"}
                      variant={isImportant ? "solid" : "outline"}
                      onClick={() => setIsImportant(!isImportant)}
                      leftIcon={<HiOutlineExclamation />}
                      size="xs"
                    >
                      <span className="hidden md:block">Important</span>
                    </Button>

                    <input type="hidden" name="isImportant" value={isImportant ? "true" : "false"} />
                    <Checkbox defaultChecked={task?.isComplete} name="isComplete" size="md" />
                  </div>
                </div>
                <div className="stack space-y-1 p-3 pt-0 md:space-y-3 md:p-5 md:pt-0">
                  <input type="hidden" name="elementId" value={element?.value} />

                  <div className="flex w-full items-end md:items-start">
                    <InlineFormField
                      required
                      label="Element"
                      name="element"
                      errors={createUpdateFetcher.data?.fieldErrors?.elementId}
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
                    errors={createUpdateFetcher.data?.fieldErrors?.date}
                  />

                  <InlineFormField
                    name="durationHours"
                    label="Duration"
                    shouldPassProps={false}
                    errors={
                      createUpdateFetcher.data?.fieldErrors?.durationHours ||
                      createUpdateFetcher.data?.fieldErrors?.durationMinutes
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
                    errors={createUpdateFetcher.data?.fieldErrors?.startTime}
                  />
                  <InlineFormField
                    name="description"
                    defaultValue={task?.description}
                    label="Description"
                    input={<Textarea />}
                    errors={createUpdateFetcher.data?.fieldErrors?.description}
                  />
                  <InlineFormField
                    name="todos"
                    label="Todos"
                    shouldPassProps={false}
                    input={
                      <div className="stack w-full space-y-1">
                        <input type="hidden" name="hasTodos" value="true" />
                        {todos.map((todo, i) => (
                          <div key={todo.id} className="hstack">
                            <Checkbox className="peer" name={`todos[${i}].isComplete`} defaultChecked={todos[i]?.isComplete} />
                            <Input
                              id={`todo-${todo.id}`}
                              ref={(el) => (itemsRef.current[i] = el)}
                              name={`todos[${i}].name`}
                              defaultValue={todos[i]?.name}
                              className={join(
                                "peer-checked:text-black/40 peer-checked:line-through dark:peer-checked:text-white/40",
                              )}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && e.metaKey) {
                                  e.preventDefault()
                                  // toggle current checkbox
                                  const checkbox = e.currentTarget.previousSibling as HTMLInputElement
                                  checkbox.checked = !checkbox.checked
                                } else if (e.key === "Enter") {
                                  e.preventDefault()
                                  // if value is empty remove input
                                  if (!e.currentTarget.value) {
                                    // get previous input
                                    const prevInput = itemsRef.current?.[i - 1]
                                    prevInput?.select()
                                    const newTodos = [...todos]
                                    newTodos.splice(i, 1)
                                    setTodos(newTodos)
                                  } else {
                                    const newTodos = [...todos]
                                    newTodos.splice(i + 1, 0, {
                                      id: new Date().getMilliseconds().toString(),
                                      name: "",
                                      isComplete: false,
                                    })
                                    setTodos(newTodos)
                                    requestAnimationFrame(() => {
                                      const nextInput = itemsRef.current?.[i + 1]
                                      nextInput?.focus()
                                    })
                                  }
                                }
                                if (e.key === "ArrowUp") {
                                  e.preventDefault()
                                  const nextInput = itemsRef.current?.[i - 1]
                                  nextInput?.select()
                                }
                                if (e.key === "ArrowDown") {
                                  e.preventDefault()
                                  const nextInput = itemsRef.current?.[i + 1]
                                  nextInput?.select()
                                }
                                if (e.key === "Backspace" && !e.currentTarget.value) {
                                  e.preventDefault()
                                  // if current input was first select second input, else select prev
                                  const isFirstInput = i === 0
                                  setTodos((c) => c.filter((t) => t.id !== todo.id))
                                  requestAnimationFrame(() => {
                                    const nextInput = itemsRef.current?.[isFirstInput ? 0 : i - 1]
                                    nextInput?.focus()
                                  })
                                }
                              }}
                            />
                          </div>
                        ))}

                        {todos.length === 0 && (
                          <Button
                            variant="outline"
                            className="w-full"
                            aria-label="add todo"
                            onClick={() => {
                              setTodos((c) => [
                                ...c,
                                { id: new Date().getMilliseconds().toString(), name: "", isComplete: false },
                              ])
                              requestAnimationFrame(() => {
                                const lastInput = itemsRef.current?.[itemsRef.current.length - 1]
                                lastInput?.focus()
                              })
                            }}
                          >
                            <BiPlus />
                          </Button>
                        )}
                      </div>
                    }
                  />

                  <FormError error={createUpdateFetcher.data?.formError} />

                  <div className="flex justify-between pt-4">
                    {task ? (
                      <Menu>
                        <MenuButton>
                          <IconButton variant="outline" aria-label="task actions" icon={<BiDotsVertical />} />
                        </MenuButton>

                        <MenuList className="left-0 bottom-full mb-2">
                          <div>
                            <MenuItem>
                              {({ className }) => (
                                <button type="button" className={className} onClick={handleDuplicate}>
                                  <RiFileCopyLine />
                                  <span className="hidden md:block">Duplicate</span>
                                </button>
                              )}
                            </MenuItem>
                            <MenuItem>
                              {({ className }) => (
                                <button type="button" className={className} onClick={handleToBacklog}>
                                  <RiTimeLine />
                                  <span className="hidden md:block">Add to backlog</span>
                                </button>
                              )}
                            </MenuItem>
                          </div>
                          <MenuItem>
                            {({ className }) => (
                              <button type="button" className={className} onClick={handleDelete}>
                                <RiDeleteBinLine className="fill-red-500" />
                                <span className="hidden md:block">Delete</span>
                              </button>
                            )}
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    ) : (
                      <div />
                    )}
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
                  </div>
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
              errors={createElementFetcher.data?.fieldErrors?.name}
            />

            <InlineFormField
              name="color"
              required
              errors={createElementFetcher.data?.fieldErrors?.color}
              label="Color"
              shouldPassProps={false}
              input={<ColorInput name="color" value={color} setValue={setColor} />}
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
