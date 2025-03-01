import dayjs from "dayjs"
import { useGlobalSearchParams, useRouter } from "expo-router"
import { AlarmClock, AlertTriangle, CalendarPlus, Check, Clock, Copy, Plus, Square, Trash, X } from "lucide-react-native"
import * as React from "react"
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, useColorScheme } from "react-native"
import { useSoftInputHeightChanged } from "react-native-avoid-softinput"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import * as DropdownMenu from "zeego/dropdown-menu"

import type { TaskReminder, TaskRepeat } from "@element/database/types"
import { TASK_REMINDER_OPTIONS, getRepeatingDatesBetween, join, merge, taskReminderHash, useDisclosure } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import type { FormResponseError } from "../lib/form"
import { useMe } from "../lib/hooks/useMe"
import { useTemporaryData } from "../lib/hooks/useTemporaryTasks"
import { useTimelineDays } from "../lib/hooks/useTimeline"
import { TaskRepeatOptions } from "../lib/taskRepeat"
import { type RouterInputs, type RouterOutputs, api } from "../lib/utils/api"
import { Button, buttonStyles } from "./Button"
import { FormError } from "./FormError"
import { FormInput, FormInputError, FormInputLabel } from "./FormInput"
import { Icon } from "./Icon"
import { Input, inputClassName } from "./Input"
import { Text } from "./Text"
import { toast } from "./Toast"

type Task = NonNullable<RouterOutputs["task"]["byId"]>

type Props = {
  isLoading: boolean
  error?: FormResponseError
} & (
  | {
      task?: undefined
      onCreate: (data: RouterInputs["task"]["create"]) => void
    }
  | {
      task: RouterOutputs["task"]["byId"]
      onUpdate: (data: RouterInputs["task"]["update"]) => void
    }
)

export function TaskForm(props: Props) {
  const router = useRouter()
  const canGoBack = router.canGoBack()
  const { date, repeat: initialRepeat, elementId } = useGlobalSearchParams()

  const [form, setForm] = React.useState({
    name: props.task?.name || "",
    description: props.task?.description || null,
    startTime: props.task?.startTime || null,
    reminder: props.task?.reminder || null,
    durationHours: props.task?.durationHours ? props.task?.durationHours?.toString() : null,
    durationMinutes: props.task?.durationMinutes ? props.task?.durationMinutes?.toString() : null,
    date: props.task?.date
      ? dayjs(props.task.date).startOf("day").add(12, "hours").toISOString()
      : (date as string | undefined) || null,
    element: props.task?.element || null,
    isImportant: props.task?.isImportant || false,
    todos: props.task?.todos || [],
  })

  const { me, isLoading } = useMe()
  const { data } = api.element.all.useQuery(undefined, { enabled: !!me })

  const tempElements = useTemporaryData((s) => s.elements)

  React.useEffect(() => {
    // if coming back from the select/create element screen, set the element to state
    if (!elementId || isLoading) return
    let element: RouterOutputs["element"]["all"][0] | undefined
    if (me) {
      if (!data) return
      element = data.find((e) => e.id === elementId)
    } else {
      // if not logged in, check the temp elements
      element = tempElements.find((e) => e.id === elementId)
    }
    if (!element) return
    setForm((f) => ({ ...f, element: element! }))
  }, [elementId, data, me, isLoading, tempElements])

  const [repeat, setRepeat] = React.useState(initialRepeat)
  React.useEffect(() => {
    if (!initialRepeat || !me) return
    setRepeat(initialRepeat)
  }, [initialRepeat, me])

  const timeProps = useDisclosure()

  const handlePickTime = (startTime: Date) => {
    timeProps.onClose()

    const isOutOfWindow =
      form.reminder && form.date
        ? dayjs(form.date)
            .set("hours", dayjs(startTime).hour())
            .set("minutes", dayjs(startTime).minute())
            .subtract(taskReminderHash[form.reminder].hours, "hours")
            .subtract(taskReminderHash[form.reminder].minutes, "minutes")
            .isBefore(dayjs())
        : null

    setForm((f) => ({ ...f, startTime: dayjs(startTime).format("HH:mm"), reminder: isOutOfWindow ? null : f.reminder }))
  }

  const dateProps = useDisclosure()
  const handlePickDate = (date: Date) => {
    dateProps.onClose()
    const isOutOfWindow = dayjs(date).isAfter(dayjs().add(1, "year")) || dayjs(date).isBefore(dayjs())
    setForm((f) => ({
      ...f,
      date: dayjs(date).format("YYYY-MM-DD"),
      reminder: isOutOfWindow ? null : f.reminder,
    }))
  }

  const [repeatEndDate, setRepeatEndDate] = React.useState<string>(
    dayjs(date as string | undefined)
      .add(1, "week")
      .format("YYYY-MM-DD"),
  )
  const repeatEndDateProps = useDisclosure()

  const handlePickRepeatEndDate = (date: Date) => {
    repeatEndDateProps.onClose()
    setRepeatEndDate(dayjs(date).format("YYYY-MM-DD"))
  }

  const scrollRef = React.useRef<ScrollView>(null)

  const nameInputRef = React.useRef<TextInput>(null)

  const inputsRef = React.useRef(form.todos.map(() => React.createRef<TextInput>()))

  const buttonContainerPaddingValue = useSharedValue(0)
  const buttonContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: buttonContainerPaddingValue.value,
    }
  })
  useSoftInputHeightChanged(({ softInputHeight }) => {
    buttonContainerPaddingValue.value = withTiming(Math.max(0, softInputHeight - 20))
  })

  const isDark = useColorScheme() === "dark"
  return (
    <View className="flex-1">
      <View className="flex flex-row pl-4 pr-2 pb-2 border-b border-gray-75 dark:border-gray-800 items-start justify-between">
        <View className="flex-1">
          <TextInput
            ref={nameInputRef}
            className="font-label pr-2 text-2xl dark:text-white"
            value={form.name}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (!form.element) {
                router.push({
                  pathname: "/elements/select",
                  params: { date: form.date || "", repeat: repeat || "" },
                })
              }
            }}
            autoFocus={!form.name}
            placeholderTextColor={isDark ? colors.gray[500] : colors.gray[300]}
            placeholder="Name"
            onChangeText={(name) => setForm((f) => ({ ...f, name }))}
          />
          {props.error?.zodError?.fieldErrors?.name?.map((error) => (
            <FormInputError key={error} error={error} />
          ))}
        </View>
        <View className="flex flex-row items-center gap-1">
          <TouchableOpacity
            onPress={() => setForm((f) => ({ ...f, isImportant: !f.isImportant }))}
            className={join(
              "rounded-sm border border-gray-100 p-1.5 dark:border-gray-700",
              form.isImportant && "bg-primary-500 border-transparent",
            )}
          >
            <Icon icon={AlertTriangle} size={16} color={form.isImportant ? "white" : undefined} />
          </TouchableOpacity>
          <TouchableOpacity onPress={canGoBack ? router.back : () => router.navigate("/")} className="p-2">
            <Icon icon={X} size={20} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 80 }}
        className="px-4 pt-2"
        contentInsetAdjustmentBehavior="always"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 gap-2">
          <View>
            <FormInput
              label="Element"
              error={props.error?.zodError?.fieldErrors?.elementId}
              input={
                <TouchableOpacity
                  className={join(inputClassName, "flex-1")}
                  onPress={() => {
                    router.push({
                      pathname: "/elements/select",
                      params: { date: form.date || "", repeat: repeat || "" },
                    })
                  }}
                >
                  <View className="flex flex-row items-center gap-2">
                    {form.element && (
                      <View
                        className="sq-4 rounded-full border border-gray-300 dark:border-gray-700"
                        style={{ backgroundColor: form.element.color }}
                      />
                    )}
                    <Text className={join("text-sm", !form.element?.name && "opacity-60")}>
                      {form.element?.name || "Select an element"}
                    </Text>
                  </View>
                </TouchableOpacity>
              }
              rightElement={
                me && (
                  <TouchableOpacity
                    onPress={() => {
                      router.push({ pathname: "/elements/create", params: { date: form.date || "" } })
                    }}
                    className="sq-10 flex items-center justify-center rounded-sm border border-gray-100 p-2 dark:border-gray-600"
                  >
                    <Icon icon={Plus} size={20} />
                  </TouchableOpacity>
                )
              }
            />
          </View>
          {form.date && (
            <View>
              <FormInput
                label="Date"
                error={props.error?.zodError?.fieldErrors?.date}
                input={
                  <TouchableOpacity onPress={dateProps.onOpen} className={inputClassName}>
                    <Text className="text-sm">{form.date ? dayjs(form.date).format("DD/MM/YYYY") : "-"}</Text>
                  </TouchableOpacity>
                }
              />
              <DateTimePickerModal
                isVisible={dateProps.isOpen}
                date={dayjs(form.date || undefined).toDate()}
                onConfirm={handlePickDate}
                onCancel={dateProps.onClose}
              />
            </View>
          )}
          <View className="gap-1">
            <FormInputLabel label="Duration" />
            <View className="flex flex-row items-center gap-3">
              <View className="flex flex-row items-center gap-2">
                <Input
                  className="w-11 px-1 text-center text-sm"
                  value={form.durationHours || ""}
                  keyboardType="number-pad"
                  onChangeText={(durationHours) => setForm((f) => ({ ...f, durationHours }))}
                />
                <Text className="text-sm opacity-70">Hours</Text>
              </View>
              <View className="flex flex-row items-center gap-2">
                <Input
                  className="w-11 px-1 text-center text-sm"
                  value={form.durationMinutes || ""}
                  keyboardType="number-pad"
                  onChangeText={(durationMinutes) => setForm((f) => ({ ...f, durationMinutes }))}
                />
                <Text className="text-sm opacity-70">Minutes</Text>
              </View>
            </View>
            {props.error?.zodError?.fieldErrors?.durationHours?.map((error) => (
              <FormInputError key={error} error={error} />
            ))}
            {props.error?.zodError?.fieldErrors?.durationMinutes?.map((error) => (
              <FormInputError key={error} error={error} />
            ))}
          </View>
          <View>
            <View className="flex flex-row items-center">
              <FormInput
                label="Start time"
                error={props.error?.zodError?.fieldErrors?.startTime}
                input={
                  <TouchableOpacity
                    className={merge(inputClassName, "w-[100px]")}
                    onPress={() => {
                      nameInputRef.current?.blur()
                      timeProps.onOpen()
                    }}
                  >
                    <Text className={join("text-sm text-center", !form.startTime && "opacity-60")}>
                      {form.startTime || "hh:mm"}
                    </Text>
                  </TouchableOpacity>
                }
              />

              {me?.stripeSubscriptionId &&
                form.startTime &&
                form.date &&
                dayjs(form.date).isBefore(dayjs().add(1, "year")) &&
                dayjs(form.date).isAfter(dayjs().startOf("day")) && (
                  <FormInput
                    label="Reminder"
                    error={props.error?.zodError?.fieldErrors?.reminder}
                    input={
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <TouchableOpacity className={merge(inputClassName, "flex flex-row items-center gap-2")}>
                            <Icon icon={AlarmClock} size={16} />
                            <Text className="text-sm">
                              {TASK_REMINDER_OPTIONS.find((r) => r.value === form.reminder)?.name || "None"}
                            </Text>
                          </TouchableOpacity>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                          <DropdownMenu.Item key="none" onSelect={() => setForm({ ...form, reminder: null })}>
                            None
                          </DropdownMenu.Item>
                          {TASK_REMINDER_OPTIONS.map((option) => (
                            <DropdownMenu.Item
                              key={option.value}
                              disabled={dayjs(form.date!)
                                .set("hour", Number(form.startTime!.split(":")[0]))
                                .set("minute", Number(form.startTime!.split(":")[1]))
                                .subtract(taskReminderHash[option.value].hours, "hours")
                                .subtract(taskReminderHash[option.value].minutes, "minutes")
                                .isBefore(dayjs())}
                              onSelect={() => {
                                setForm({ ...form, reminder: option.value })
                              }}
                            >
                              {option.name}
                            </DropdownMenu.Item>
                          ))}
                          <DropdownMenu.Arrow />
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    }
                  />
                )}
            </View>
            <DateTimePickerModal
              mode="time"
              isVisible={timeProps.isOpen}
              date={dayjs()
                .set("hour", Number(form.startTime?.split(":")[0] || 12))
                .set("minutes", Number(form.startTime?.split(":")[1] || 0))
                .toDate()}
              onConfirm={handlePickTime}
              onCancel={timeProps.onClose}
            />
          </View>
          {!props.task && me?.stripeSubscriptionId && (
            <View className="gap-2">
              <FormInput
                label="Repeat"
                error={props.error?.zodError?.fieldErrors?.repeat}
                input={
                  <TouchableOpacity
                    className={inputClassName}
                    onPress={() => {
                      nameInputRef.current?.blur()
                      router.push({
                        pathname: "/repeat-select",
                        params: { date: form.date || "", repeat: repeat || "" },
                      })
                    }}
                  >
                    <Text className={join("text-sm", !repeat && "opacity-60")}>
                      {TaskRepeatOptions[repeat as TaskRepeat] || "Doesn't repeat"}
                    </Text>
                  </TouchableOpacity>
                }
              />
              {repeat && (
                <View>
                  <View className="flex flex-row gap-2">
                    <View className="w-[70px] pt-1">
                      <FormInputLabel label="End date" />
                      <Text className="text-xxs opacity-70">
                        Creating{" "}
                        {1 +
                          getRepeatingDatesBetween(dayjs(form.date).toDate(), dayjs(repeatEndDate).toDate(), repeat as TaskRepeat)
                            .length}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className={join(inputClassName, "flex-1")}
                      onPress={() => {
                        nameInputRef.current?.blur()
                        repeatEndDateProps.onOpen()
                      }}
                    >
                      <Text className={join("text-sm", !repeat && "opacity-60")}>
                        {dayjs(repeatEndDate).format("DD/MM/YYYY")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {props.error?.zodError?.fieldErrors?.repeatEndDate?.map((error) => (
                    <FormInputError key={error} error={error} />
                  ))}
                  <DateTimePickerModal
                    isVisible={repeatEndDateProps.isOpen}
                    date={dayjs(repeatEndDate).toDate()}
                    onConfirm={handlePickRepeatEndDate}
                    onCancel={repeatEndDateProps.onClose}
                  />
                </View>
              )}
            </View>
          )}

          <View>
            <FormInput
              error={props.error?.zodError?.fieldErrors?.description}
              label="Description"
              value={form.description || ""}
              multiline
              onChangeText={(description) => setForm((f) => ({ ...f, description }))}
            />
          </View>
          <View className="gap-1">
            <FormInputLabel label="Todos" />
            {form.todos.map((todo, index) => (
              <View key={todo.id} className="flex flex-row items-center gap-2">
                <TouchableOpacity
                  className="relative"
                  onPress={() => {
                    setForm((f) => ({
                      ...f,
                      todos: f.todos.map((t) => (t.id === todo.id ? { ...t, isComplete: !t.isComplete } : t)),
                    }))
                  }}
                >
                  <Square
                    size={28}
                    strokeWidth={1}
                    color={todo.isComplete ? colors.primary[500] : isDark ? colors.gray[600] : colors.gray[100]}
                    fill={todo.isComplete ? colors.primary[500] : "transparent"}
                  />
                  {todo.isComplete && (
                    <View style={StyleSheet.absoluteFill} className="flex items-center justify-center">
                      <Icon icon={Check} size={18} strokeWidth={3} fill="transparent" color="white" />
                    </View>
                  )}
                </TouchableOpacity>
                <Input
                  ref={inputsRef.current[index]}
                  className="flex-1 py-1.5"
                  value={todo.name}
                  style={{
                    textDecorationStyle: todo.isComplete ? "solid" : undefined,
                    textDecorationLine: todo.isComplete ? "line-through" : undefined,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (index === form.todos.length - 1) {
                      setForm((f) => ({ ...f, todos: [...f.todos, { id: Date.now().toString(), name: "", isComplete: false }] }))
                    } else {
                      inputsRef.current[index + 1]?.current?.focus()
                    }
                  }}
                  onChangeText={(text) =>
                    setForm((f) => ({
                      ...f,
                      todos: f.todos.map((t) => (t.id === todo.id ? { ...t, name: text } : t)),
                    }))
                  }
                />
                <TouchableOpacity
                  className={buttonStyles({
                    size: "xs",
                    variant: "outline",
                    className: "sq-7 rounded border-gray-100 dark:border-gray-600",
                  })}
                  onPress={() => {
                    setForm((f) => ({ ...f, todos: f.todos.filter((t) => t.id !== todo.id) }))
                  }}
                >
                  <Icon icon={X} size={16} className="opacity-80" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => {
                setForm((f) => ({ ...f, todos: [...f.todos, { id: Date.now().toString(), name: "", isComplete: false }] }))
                scrollRef.current?.scrollToEnd({ animated: true })
              }}
              className={merge(buttonStyles({ size: "md", variant: "outline" }))}
            >
              <Icon icon={Plus} size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Animated.View
        style={buttonContainerAnimatedStyle}
        className="border-t border-gray-100 bg-white dark:border-gray-600 dark:bg-black"
      >
        <View className="gap-2 px-4 py-2">
          <FormError error={props.error?.formError} />

          <View className="flex flex-row items-center gap-2">
            {props.task && <TaskActions task={props.task} />}
            <Button
              className="flex-1"
              isLoading={props.isLoading}
              onPress={() => {
                if (!form.element) return toast({ title: "Please select an element", type: "error" })
                const payload = {
                  ...form,
                  durationHours: Number(form.durationHours),
                  durationMinutes: Number(form.durationMinutes),
                }
                if (props.task) {
                  return props.onUpdate({ id: props.task.id, ...payload, elementId: form.element.id })
                }
                return props.onCreate({
                  ...payload,
                  repeat: (repeat as TaskRepeat | null) || null,
                  repeatEndDate: repeat ? dayjs(repeatEndDate).toDate() : null,
                  elementId: form.element.id,
                })
              }}
            >
              {props.task ? "Update" : "Create"}
            </Button>
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

function TaskActions({ task }: { task: Task }) {
  const utils = api.useUtils()
  const router = useRouter()
  const tempActions = useTemporaryData()
  const { daysBack, daysForward } = useTimelineDays()
  const { me } = useMe()
  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      if (task.date) {
        void utils.task.timeline.refetch({ daysBack, daysForward })
      } else {
        void utils.task.backlog.refetch()
      }
      router.back()
    },
  })
  const handleDelete = () => {
    if (task.repeatParentId) return router.push(`/${task.id}/delete`)
    if (me) {
      deleteTask.mutate({ id: task.id })
    } else {
      tempActions.deleteTask(task.id)
      router.back()
    }
  }

  const addToBacklog = api.task.update.useMutation({
    onSuccess: async (updatedTask) => {
      void utils.task.timeline.refetch({ daysBack, daysForward })
      void utils.task.backlog.refetch()
      utils.task.byId.setData({ id: task.id }, updatedTask)
      router.back()
    },
  })
  const handleAddToBacklog = () => {
    if (!me) return Alert.alert("You must have an account to add a task to the backlog")
    addToBacklog.mutate({ id: task.id, date: null, isComplete: false })
  }

  const addToTimeline = api.task.update.useMutation({
    onSuccess: async (updatedTask) => {
      void utils.task.timeline.refetch({ daysBack, daysForward })
      void utils.task.backlog.refetch()
      utils.task.byId.setData({ id: task.id }, updatedTask)
      router.back()
    },
  })
  const handleAddToTimeline = () => {
    if (!me) return Alert.alert("You must have an account to add a task to the timeline")
    addToTimeline.mutate({ id: task.id, date: new Date() })
  }

  const duplicate = api.task.duplicate.useMutation({
    onSuccess: () => {
      // have to refetch to get the new order, or would have to calculate here
      if (task.date) {
        void utils.task.timeline.refetch({ daysBack, daysForward })
      } else {
        void utils.task.backlog.refetch()
      }
      router.back()
    },
    onError: (error) => {
      toast({ title: error.message })
    },
  })
  const handleDuplicate = () => {
    if (me) {
      duplicate.mutate({ id: task.id })
    } else {
      tempActions.addTask({ ...task, elementId: task.element.id })
      router.back()
    }
  }
  return (
    <View className="flex flex-row items-center justify-between gap-2">
      <TouchableOpacity
        onPress={handleDelete}
        className="sq-12 flex items-center justify-center rounded-full border border-gray-100 dark:border-gray-600"
      >
        {deleteTask.isLoading ? <ActivityIndicator /> : <Icon icon={Trash} size={20} color="red" />}
      </TouchableOpacity>
      {task.date ? (
        <TouchableOpacity
          onPress={handleAddToBacklog}
          className="sq-12 flex items-center justify-center rounded-full border border-gray-100 dark:border-gray-600"
        >
          {addToBacklog.isLoading ? <ActivityIndicator /> : <Icon icon={Clock} size={20} />}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleAddToTimeline}
          className="sq-12 flex items-center justify-center rounded-full border border-gray-100 dark:border-gray-600"
        >
          {addToTimeline.isLoading ? <ActivityIndicator /> : <Icon icon={CalendarPlus} size={20} />}
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={handleDuplicate}
        className="sq-12 flex items-center justify-center rounded-full border border-gray-100 dark:border-gray-600"
      >
        {duplicate.isLoading ? <ActivityIndicator /> : <Icon icon={Copy} size={20} />}
      </TouchableOpacity>
    </View>
  )
}
