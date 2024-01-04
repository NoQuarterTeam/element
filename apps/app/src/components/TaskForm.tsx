import * as React from "react"
import { TextInput, TouchableOpacity, useColorScheme, View } from "react-native"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import dayjs from "dayjs"
import { useGlobalSearchParams, useRouter } from "expo-router"
import { AlertTriangle, Plus, X } from "lucide-react-native"

import { join, useDisclosure } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { type FormResponseError } from "../lib/form"
import { useMe } from "../lib/hooks/useMe"
import { useTemporaryData } from "../lib/hooks/useTemporaryTasks"
import { api, type RouterInputs, type RouterOutputs } from "../lib/utils/api"
import { Button } from "./Button"
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
      task: Task
      onUpdate: (data: RouterInputs["task"]["update"]) => void
    }
)
export function TaskForm(props: Props) {
  const router = useRouter()
  const canGoBack = router.canGoBack()
  const { date, elementId } = useGlobalSearchParams()

  const [form, setForm] = React.useState({
    name: props.task?.name || "",
    description: props.task?.description || "",
    startTime: props.task?.startTime || "",
    durationHours: props.task?.durationHours?.toString() || "",
    durationMinutes: props.task?.durationMinutes?.toString() || "",
    date: props.task?.date
      ? dayjs(props.task.date).startOf("day").add(12, "hours").toISOString()
      : (date as string | undefined) || "",
    element: props.task?.element || null,
    isImportant: props.task?.isImportant || false,
  })

  const { me } = useMe()
  const { data } = api.element.all.useQuery(undefined, { enabled: !!me })

  const tempElements = useTemporaryData((s) => s.elements)

  React.useEffect(() => {
    if (!elementId || !data) return
    const element = (me ? data : tempElements).find((e) => e.id === elementId)
    if (!element) return
    setForm((f) => ({ ...f, element }))
  }, [elementId, data, me, tempElements])

  const timeProps = useDisclosure()

  const handlePickTime = (startTime: Date) => {
    timeProps.onClose()
    setForm((f) => ({ ...f, startTime: dayjs(startTime).format("HH:mm") }))
  }
  const dateProps = useDisclosure()
  const handlePickDate = (date: Date) => {
    dateProps.onClose()
    setForm((f) => ({ ...f, date: dayjs(date).format("YYYY-MM-DD") }))
  }

  const nameInputRef = React.useRef<TextInput>(null)
  const colorScheme = useColorScheme()
  return (
    <View className="space-y-2">
      <View className="flex flex-row items-start justify-between">
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
                  params: { date: form.date, redirect: "/new" },
                })
              }
            }}
            autoFocus={!!!form.name}
            placeholderTextColor={colorScheme === "dark" ? colors.gray[500] : colors.gray[300]}
            placeholder="Name"
            onChangeText={(name) => setForm((f) => ({ ...f, name }))}
          />
          {props.error?.zodError?.fieldErrors?.name?.map((error) => <FormInputError key={error} error={error} />)}
        </View>
        <View className="flex flex-row items-center space-x-2 pt-1">
          <TouchableOpacity
            onPress={() => setForm((f) => ({ ...f, isImportant: !f.isImportant }))}
            className={join(
              "rounded-sm border border-gray-100 p-2 dark:border-gray-700",
              form.isImportant && "bg-primary-500 border-transparent",
            )}
          >
            <Icon icon={AlertTriangle} size={20} color={form.isImportant ? "white" : undefined} />
          </TouchableOpacity>
          <TouchableOpacity onPress={canGoBack ? router.back : () => router.replace("/")} className="p-2">
            <Icon icon={X} size={24} />
          </TouchableOpacity>
        </View>
      </View>
      <View>
        <FormInput
          label="Element"
          error={props.error?.zodError?.fieldErrors?.elementId}
          input={
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "/elements/select",
                  params: { date: form.date, redirect: props.task ? `/${props.task.id}` : "/new" },
                })
              }}
              className={join(inputClassName, "flex-1")}
            >
              <Text className={join("text-sm", !form.element?.name && "opacity-60")}>
                {form.element?.name || "Select an element"}
              </Text>
            </TouchableOpacity>
          }
          rightElement={
            me && (
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/elements/create",
                    params: { date: form.date, redirect: props.task ? `/${props.task.id}` : "/new" },
                  })
                }}
                className="rounded-sm border border-gray-100 p-2.5 dark:border-gray-600"
              >
                <Icon icon={Plus} size={20} />
              </TouchableOpacity>
            )
          }
        />
      </View>
      <View>
        <FormInput
          label="Date"
          error={props.error?.zodError?.fieldErrors?.date}
          input={
            <TouchableOpacity onPress={dateProps.onOpen} className={inputClassName}>
              <Text className="text-sm">{dayjs(form.date).format("DD/MM/YYYY")}</Text>
            </TouchableOpacity>
          }
        />
        <DateTimePickerModal
          isVisible={dateProps.isOpen}
          date={dayjs(form.date).toDate()}
          onConfirm={handlePickDate}
          onCancel={dateProps.onClose}
        />
      </View>
      <View className="space-y-1">
        <FormInputLabel label="Duration" />
        <View className="flex flex-row items-center space-x-3">
          <View className="flex flex-row items-center space-x-2">
            <Input
              className="w-11 px-1 text-center text-sm"
              value={form.durationHours}
              keyboardType="number-pad"
              onChangeText={(durationHours) => setForm((f) => ({ ...f, durationHours }))}
            />
            <Text className="text-sm opacity-70">Hours</Text>
          </View>
          <View className="flex flex-row items-center space-x-2">
            <Input
              className="w-11 px-1 text-center text-sm"
              value={form.durationMinutes}
              keyboardType="number-pad"
              onChangeText={(durationMinutes) => setForm((f) => ({ ...f, durationMinutes }))}
            />
            <Text className="text-sm opacity-70">Minutes</Text>
          </View>
        </View>
        {props.error?.zodError?.fieldErrors?.durationHours?.map((error) => <FormInputError key={error} error={error} />)}
        {props.error?.zodError?.fieldErrors?.durationMinutes?.map((error) => <FormInputError key={error} error={error} />)}
      </View>
      <View>
        <FormInput
          label="Start time"
          error={props.error?.zodError?.fieldErrors?.startTime}
          input={
            <TouchableOpacity
              onPress={() => {
                nameInputRef.current?.blur()
                timeProps.onOpen()
              }}
              className={inputClassName}
            >
              <Text className={join("text-sm", !form.startTime && "opacity-60")}>{form.startTime || "hh:mm"}</Text>
            </TouchableOpacity>
          }
        />
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

      <View>
        <FormInput
          error={props.error?.zodError?.fieldErrors?.description}
          label="Description"
          value={form.description}
          multiline
          onChangeText={(description) => setForm((f) => ({ ...f, description }))}
        />
      </View>

      <View className="space-y-1">
        <Button
          isLoading={props.isLoading}
          onPress={() => {
            if (!form.element) return toast({ title: "Please select an element", type: "error" })
            if (props.task) {
              return props.onUpdate({ id: props.task.id, ...form, elementId: form.element.id })
            } else {
              return props.onCreate({ ...form, elementId: form.element.id })
            }
          }}
        >
          {props.task ? "Update" : "Create"}
        </Button>

        <FormError error={props.error?.formError} />
      </View>
    </View>
  )
}
