import * as React from "react"
import { type Element, TaskRepeat } from "@element/database/types"
import { getRepeatingDatesBetween, join, randomHexColor, useDisclosure } from "@element/shared"
import { useSearchParams } from "@remix-run/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { AlertTriangle, Clock, Copy, Plus, Trash } from "lucide-react"

import { FORM_ACTION } from "~/lib/form"
import { ActionDataSuccessResponse, type ActionDataErrorResponse } from "~/lib/form.server"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { TaskActionMethods, type TaskDetail } from "~/pages/_app.timeline.$id"
import { ElementsActionMethods } from "~/pages/_app.timeline.elements"
import type { TaskElement } from "~/pages/api+/elements"
import type { TimelineTask } from "~/pages/api+/tasks"
import { TasksActionMethods } from "~/pages/api+/tasks"

import { ColorInput } from "./ColorInput"
import { Button } from "./ui/Button"
import { ButtonGroup } from "./ui/ButtonGroup"
import { FormButton, FormError, InlineFormField, useFetcher } from "./ui/Form"
import { IconButton } from "./ui/IconButton"
import { Checkbox, Input, Select, Textarea } from "./ui/Inputs"
import { Modal } from "./ui/Modal"
import { Singleselect } from "./ui/ReactSelect"
import { Tooltip } from "./ui/Tooltip"

interface FormProps {
  onClose: () => void
  task?: TaskDetail
}
export const TaskForm = React.memo(function _TaskForm({ task, onClose }: FormProps) {
  const [todos, setTodos] = React.useState(task?.todos || [])
  const [searchParams] = useSearchParams()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const day = searchParams.get("day") || undefined
  const { addTask, updateTask, removeTask, refetch } = useTimelineTasks()
  const [isImportant, setIsImportant] = React.useState(task?.isImportant || false)
  const [isComplete, setIsComplete] = React.useState(task?.isComplete || false)
  const [color, setColor] = React.useState(randomHexColor())
  const [repeat, setRepeat] = React.useState<TaskRepeat | undefined>(task?.repeat || undefined)
  const [repeatEndDate, setRepeatEndDate] = React.useState<string>(dayjs().add(1, "week").format("YYYY-MM-DD"))
  const [date, setDate] = React.useState(day || (task ? dayjs(task.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")))

  const createUpdateFetcher = useFetcher<ActionDataErrorResponse<any> | ActionDataSuccessResponse<{ task: TimelineTask }>>({
    onFinish: (data) => {
      if (!data.success) return
      if (task) {
        updateTask(data.task)
      } else {
        if (repeat) {
          refetch()
        } else {
          addTask(data.task)
        }
      }
      setTimeout(onClose, 100)
    },
  })

  const deleteModalProps = useDisclosure()
  const deleteSubmit = useFetcher<ActionDataSuccessResponse<object>>({
    onFinish: (data) => {
      if (!data.success || !task) return
      if (task.repeat || task.repeatParentId) {
        refetch()
      } else {
        removeTask(task)
      }
      onClose()
    },
  })
  const handleDelete = (shouldDeleteFuture: boolean) => {
    if (!task) return
    deleteSubmit.submit(
      { _action: TaskActionMethods.DeleteTask, shouldDeleteFuture: shouldDeleteFuture ? "true" : "false" },
      { method: "delete", action: `/timeline/${task.id}` },
    )
  }

  const duplicateSubmit = useFetcher<ActionDataErrorResponse<any> | ActionDataSuccessResponse<{ task: TimelineTask }>>({
    onFinish: (res) => {
      if (!res.success) return
      addTask(res.task)
      setTimeout(onClose, 100)
    },
  })
  const handleDuplicate = () => {
    if (!task) return
    duplicateSubmit.submit({ [FORM_ACTION]: TaskActionMethods.DuplicateTask }, { method: "post", action: `/timeline/${task.id}` })
  }

  const addToBacklogSubmit = useFetcher<ActionDataErrorResponse<any> | ActionDataSuccessResponse<{ task: TimelineTask }>>({
    onFinish: (res) => {
      if (!res.success) return
      removeTask(res.task)
      setTimeout(onClose, 100)
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
  const createElementFetcher = useFetcher<ActionDataErrorResponse<any> | ActionDataSuccessResponse<{ element: Element }>>({
    onFinish: (res) => {
      if (!res.success) return
      const { element: createdElement } = res
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
    <createUpdateFetcher.Form method="post" className="relative" action={task ? `/timeline/${task.id}` : "/api/tasks"}>
      <div ref={containerRef} className="scrollbar-hide max-h-[80vh] overflow-y-scroll">
        <div className="flex w-full items-start justify-between">
          <input
            className="w-full border-none bg-transparent pb-1 pl-3 pt-3 text-2xl text-gray-900 outline-none focus:outline-none focus:ring-transparent dark:text-gray-100 md:pl-5 md:pt-5 md:text-4xl"
            required
            name="name"
            placeholder="Name"
            defaultValue={task?.name}
            autoFocus
          />
          <div className="flex justify-end space-x-1 p-3 md:p-5">
            <Button
              variant={isImportant ? "brand" : "outline"}
              onClick={() => setIsImportant(!isImportant)}
              leftIcon={<AlertTriangle size={16} />}
              size="xs"
              className="hidden md:flex"
            >
              Important
            </Button>
            <IconButton
              aria-label="important"
              className="flex md:hidden"
              variant={isImportant ? "brand" : "outline"}
              onClick={() => setIsImportant(!isImportant)}
              icon={<AlertTriangle size={16} />}
              size="xs"
            />

            <input type="hidden" name="isImportant" value={isImportant ? "true" : "false"} />
            <Checkbox defaultChecked={isComplete} onChange={() => setIsComplete(!isComplete)} size="md" />
            <input type="hidden" name="isComplete" value={isComplete ? "true" : "false"} />
          </div>
        </div>
        <div className="relative space-y-1 p-3 pt-0 md:space-y-3 md:p-5 md:pt-0">
          <input type="hidden" name="elementId" value={element?.value} />

          <div className="flex w-full items-end md:items-start">
            <InlineFormField
              required
              label="Element"
              name="element"
              errors={!createUpdateFetcher.data?.success && createUpdateFetcher.data?.fieldErrors?.elementId}
              input={
                <Singleselect
                  value={element}
                  onChange={setElement}
                  formatOptionLabel={(option: any) => (
                    <div className="hstack">
                      <div className="sq-4 rounded-full" style={{ background: option.color }} />
                      <p>{option.label}</p>
                    </div>
                  )}
                  options={elements?.map((e) => ({ label: e.name, value: e.id, color: e.color }))}
                />
              }
            />
            <Button className="ml-2" onClick={elementModalProps.onOpen} variant="outline" leftIcon={<Plus size={16} />}>
              Create
            </Button>
            <Modal title="Create an Element" size="lg" {...elementModalProps}>
              <createElementFetcher.Form method="post" action="/timeline/elements">
                <div className="space-y-2 p-4">
                  <InlineFormField
                    autoFocus
                    name="name"
                    label="Name"
                    size="sm"
                    required
                    errors={!createElementFetcher.data?.success && createElementFetcher.data?.fieldErrors?.name}
                  />

                  <InlineFormField
                    name="color"
                    required
                    errors={!createElementFetcher.data?.success && createElementFetcher.data?.fieldErrors?.color}
                    label="Color"
                    shouldPassProps={false}
                    input={<ColorInput name="color" value={color} setValue={setColor} />}
                  />

                  <ButtonGroup>
                    <Button variant="ghost" disabled={createElementFetcher.state !== "idle"} onClick={elementModalProps.onClose}>
                      Cancel
                    </Button>
                    <Button
                      name={FORM_ACTION}
                      value={ElementsActionMethods.CreateElement}
                      type="submit"
                      variant="primary"
                      isLoading={createElementFetcher.state !== "idle"}
                    >
                      Create
                    </Button>
                  </ButtonGroup>
                </div>
              </createElementFetcher.Form>
            </Modal>
          </div>

          {(!task || task.date) && (
            <InlineFormField
              type="date"
              name="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              label="Date"
              errors={!createUpdateFetcher.data?.success && createUpdateFetcher.data?.fieldErrors?.date}
            />
          )}

          <InlineFormField
            name="durationHours"
            label="Duration"
            shouldPassProps={false}
            errors={
              (!createUpdateFetcher.data?.success && createUpdateFetcher.data?.fieldErrors?.durationHours) ||
              (!createUpdateFetcher.data?.success && createUpdateFetcher.data?.fieldErrors?.durationMinutes)
            }
            input={
              <div className="hstack">
                <div className="hstack space-x-1">
                  <Input
                    className="sq-8 px-0 text-center"
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
                    className="sq-8 px-0 text-center"
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

          <div className="flex space-x-2">
            <InlineFormField
              pattern="^([01]\d|2[0-3]):?([0-5]\d)$"
              type="time"
              name="startTime"
              defaultValue={task?.startTime}
              label="Start time"
              errors={!createUpdateFetcher.data?.success && createUpdateFetcher.data?.fieldErrors?.startTime}
            />
            {/* <Tooltip label="Notifications">
            <IconButton
              size="sm"
              variant="outline"
              icon={<RiNotification2Line size={68}/>}
              aria-label="send notifications"
              // onClick={() => {

              // }}
            />
          </Tooltip> */}
          </div>

          {!task && (
            <InlineFormField
              name="repeat"
              label="Repeat"
              shouldPassProps={false}
              errors={
                !createUpdateFetcher.data?.success
                  ? createUpdateFetcher.data?.fieldErrors?.repeat || (createUpdateFetcher.data?.fieldErrors as any)?.repeatEndDate
                  : undefined
              }
              input={
                <div className="w-full space-y-2">
                  {repeat && <input type="hidden" name="repeat" value={repeat} />}
                  <Select id="repeat" value={repeat || ""} onChange={(e) => setRepeat(e.target.value as TaskRepeat)}>
                    <option value="">Doesn't repeat</option>
                    {Object.keys(TaskRepeat).map((key) => (
                      <option key={key} value={key}>
                        {key.toLowerCase()[0]!.toUpperCase() + key.toLowerCase().slice(1)}
                      </option>
                    ))}
                  </Select>

                  {!task && repeat ? (
                    <label className="flex items-center" htmlFor="repeatEndDate">
                      <div className="mr-2 flex min-w-[80px] flex-col">
                        <span className="whitespace-nowrap text-sm">End date</span>
                        <span className="text-xxs opacity-70">
                          Creating{" "}
                          {1 + getRepeatingDatesBetween(dayjs(date).toDate(), dayjs(repeatEndDate).toDate(), repeat).length}
                        </span>
                      </div>

                      <Input
                        autoFocus
                        required
                        max={dayjs().add(1, "year").format("YYYY-MM-DD")}
                        value={repeatEndDate}
                        onChange={(e) => setRepeatEndDate(e.target.value)}
                        name="repeatEndDate"
                        type="date"
                      />
                    </label>
                  ) : (
                    <div />
                  )}
                </div>
              }
            />
          )}
          <InlineFormField
            name="description"
            defaultValue={task?.description}
            label="Description"
            input={<Textarea />}
            errors={!createUpdateFetcher.data?.success && createUpdateFetcher.data?.fieldErrors?.description}
          />
          <InlineFormField
            name="todos"
            label="Todos"
            shouldPassProps={false}
            input={
              <div className="w-full space-y-1">
                <input type="hidden" name="hasTodos" value="true" />
                {todos.map((todo, i) => (
                  <div key={todo.id} className="hstack">
                    <Checkbox className="peer" name={`todos[${i}].isComplete`} defaultChecked={todos[i]?.isComplete} />
                    <Input
                      id={`todo-${todo.id}`}
                      ref={(el) => (itemsRef.current[i] = el)}
                      name={`todos[${i}].name`}
                      defaultValue={todos[i]?.name}
                      className={join("peer-checked:text-black/40 peer-checked:line-through dark:peer-checked:text-white/40")}
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
                            setTimeout(() => {
                              const nextInput = itemsRef.current?.[i + 1]
                              nextInput?.focus()
                              containerRef.current?.scroll({ top: 1000 })
                            }, 10)
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
                          setTimeout(() => {
                            const nextInput = itemsRef.current?.[isFirstInput ? 0 : i - 1]
                            nextInput?.focus()
                          }, 10)
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
                      setTodos((c) => [...c, { id: new Date().getMilliseconds().toString(), name: "", isComplete: false }])
                      setTimeout(() => {
                        const lastInput = itemsRef.current?.[itemsRef.current.length - 1]
                        lastInput?.focus()
                      }, 50)
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                )}
              </div>
            }
          />

          <FormError error={!createUpdateFetcher.data?.success && createUpdateFetcher.data?.formError} />

          <div className="h-14" />
        </div>
        <div className="bg-background absolute bottom-0 left-0 z-20 flex h-14 w-full justify-between border-t px-2">
          {task ? (
            <>
              <div className="hstack">
                <Tooltip label="Delete">
                  <IconButton
                    variant="outline"
                    isLoading={deleteSubmit.state === "submitting"}
                    icon={<Trash className="text-red-500" size={16} />}
                    aria-label="delete task"
                    onClick={task.repeat || task.repeatParentId ? deleteModalProps.onOpen : () => handleDelete(false)}
                  />
                </Tooltip>
                {task.date && (
                  <Tooltip label="Add to backlog">
                    <IconButton
                      isLoading={addToBacklogSubmit.state === "submitting"}
                      variant="outline"
                      icon={<Clock size={16} />}
                      aria-label="Add to backlog"
                      onClick={handleToBacklog}
                    />
                  </Tooltip>
                )}
                <Tooltip label="Duplicate">
                  <IconButton
                    isLoading={duplicateSubmit.state === "submitting"}
                    variant="outline"
                    icon={<Copy size={16} />}
                    aria-label="duplicate task"
                    onClick={handleDuplicate}
                  />
                </Tooltip>
              </div>

              <Modal {...deleteModalProps} size="md" title="Deleting task">
                <div className="space-y-2 p-4">
                  <p>Do you want to only delete this task or all future tasks as well?</p>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={deleteModalProps.onClose}>
                      Cancel
                    </Button>
                    <ButtonGroup>
                      <Button onClick={() => handleDelete(false)}>Delete this task</Button>
                      <Button variant="destructive" onClick={() => handleDelete(true)}>
                        Delete all future
                      </Button>
                    </ButtonGroup>
                  </div>
                </div>
              </Modal>
            </>
          ) : (
            <div />
          )}
          <ButtonGroup>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <FormButton
              value={task ? TaskActionMethods.UpdateTask : TasksActionMethods.AddTask}
              isLoading={createUpdateFetcher.state !== "idle"}
            >
              {task ? "Update" : "Create"}
            </FormButton>
          </ButtonGroup>
        </div>
      </div>
    </createUpdateFetcher.Form>
  )
})
