import * as React from "react"
import { Modal, ScrollView, TextInput, TouchableOpacity, useColorScheme, View } from "react-native"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import dayjs from "dayjs"
import { useGlobalSearchParams, useRouter } from "expo-router"
import { AlertTriangle, Plus, X } from "lucide-react-native"
import ColorPicker, { HueSlider, Panel1, Preview } from "reanimated-color-picker"

import { join, randomHexColor, useDisclosure } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { useMe } from "../lib/hooks/useMe"
import { useTemporaryData } from "../lib/hooks/useTemporaryTasks"
import { api, type RouterOutputs } from "../lib/utils/api"
import { Button } from "./Button"
import { FormError } from "./FormError"
import { FormInput, FormInputError, FormInputLabel } from "./FormInput"
import { Icon } from "./Icon"
import { Input, inputClassName } from "./Input"
import { ModalView } from "./ModalView"
import { Text } from "./Text"

type Task = NonNullable<RouterOutputs["task"]["byId"]>

export type TaskFormData = {
  name: string
  description: string | undefined
  startTime: string | undefined
  durationHours: string | undefined
  durationMinutes: string | undefined
  date: string | undefined
  isImportant: boolean
  element: {
    id: string
    name: string
    color: string
  }
}
interface Props {
  isLoading: boolean
  task?: Task
  fieldErrors?: Record<string, string[] | undefined>
  formError?: string
  onSubmit: (data: TaskFormData) => void
}

export function TaskForm({ task, fieldErrors, formError, ...props }: Props) {
  const router = useRouter()
  const canGoBack = router.canGoBack()
  const { date } = useGlobalSearchParams()

  const [form, setForm] = React.useState<TaskFormData>({
    name: task?.name || "",
    description: task?.description || "",
    startTime: task?.startTime || "",
    durationHours: task?.durationHours?.toString() || "",
    durationMinutes: task?.durationMinutes?.toString() || "",
    date: task?.date ? dayjs(task.date).startOf("day").add(12, "hours").toISOString() : (date as string | undefined) || "",
    element: task?.element || { id: "", name: "", color: "" },
    isImportant: task?.isImportant || false,
  })
  const utils = api.useUtils()

  const { me } = useMe()
  const { data } = api.element.all.useQuery(undefined, { enabled: !!me })

  const elementCreateModalProps = useDisclosure()
  const createElement = api.element.create.useMutation()
  const handleCreateElement = async (element: { name: string; color: string }) => {
    createElement.mutate(element, {
      onSuccess: (data) => {
        setForm((f) => ({ ...f, element: { id: data.id, name: data.name, color: data.color } }))
        void utils.element.all.invalidate()
        elementCreateModalProps.onClose()
      },
    })
  }
  const elementModalProps = useDisclosure()

  const timeProps = useDisclosure()

  const handlePickTime = (startTime: Date) => {
    timeProps.onClose()
    setForm((f) => ({ ...f, startTime: dayjs(startTime).format("HH:mm") }))
  }
  const tempElements = useTemporaryData((s) => s.elements)
  const dateProps = useDisclosure()
  const handlePickDate = (date: Date) => {
    dateProps.onClose()
    setForm((f) => ({ ...f, date: dayjs(date).format("YYYY-MM-DD") }))
  }
  const colorScheme = useColorScheme()
  return (
    <View className="space-y-2">
      <View className="flex flex-row items-start justify-between">
        <View className="flex-1">
          <TextInput
            className="font-label text-2xl dark:text-white"
            value={form.name}
            multiline
            autoFocus={!task}
            placeholderTextColor={colorScheme === "dark" ? colors.gray[500] : colors.gray[300]}
            placeholder="Name"
            onChangeText={(name) => setForm((f) => ({ ...f, name }))}
          />
          {fieldErrors?.name?.map((error) => <FormInputError key={error} error={error} />)}
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
          error={fieldErrors?.elementId}
          input={
            <TouchableOpacity onPress={elementModalProps.onOpen} className={join(inputClassName, "flex-1")}>
              <Text className={join("text-sm", !form.element.name && "opacity-60")}>
                {form.element.name || "Select an element"}
              </Text>
            </TouchableOpacity>
          }
          rightElement={
            me && (
              <TouchableOpacity
                onPress={elementCreateModalProps.onOpen}
                className="rounded-sm border border-gray-100 p-2.5 dark:border-gray-600"
              >
                <Icon icon={Plus} size={20} />
              </TouchableOpacity>
            )
          }
        />

        <Modal
          animationType="slide"
          presentationStyle="formSheet"
          visible={elementCreateModalProps.isOpen}
          onDismiss={elementCreateModalProps.onClose}
          onRequestClose={elementCreateModalProps.onClose}
        >
          <ModalView title="Create element" onBack={elementCreateModalProps.onClose}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <ElementForm onCreate={handleCreateElement} isLoading={createElement.isLoading} />
            </ScrollView>
          </ModalView>
        </Modal>
        <Modal
          animationType="slide"
          presentationStyle="formSheet"
          visible={elementModalProps.isOpen}
          onDismiss={elementModalProps.onClose}
          onRequestClose={elementModalProps.onClose}
        >
          <ModalView title="Select element" onBack={elementModalProps.onClose}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 100, paddingTop: 0 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="space-y-1 pt-2">
                {(me ? data : tempElements)?.map((element) => (
                  <TouchableOpacity
                    key={element.id}
                    className="flex flex-row items-center space-x-2 p-1"
                    onPress={() => {
                      setForm((f) => ({ ...f, element }))
                      elementModalProps.onClose()
                    }}
                  >
                    <View className="sq-4 rounded-full" style={{ backgroundColor: element.color }} />
                    <Text className="text-lg">{element.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </ModalView>
        </Modal>
      </View>
      <View>
        <FormInput
          label="Date"
          error={fieldErrors?.date}
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
        {fieldErrors?.durationHours?.map((error) => <FormInputError key={error} error={error} />)}
        {fieldErrors?.durationMinutes?.map((error) => <FormInputError key={error} error={error} />)}
      </View>
      <View>
        <FormInput
          label="Start time"
          error={fieldErrors?.startTime}
          input={
            <TouchableOpacity onPress={timeProps.onOpen} className={inputClassName}>
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
          error={fieldErrors?.description}
          label="Description"
          value={form.description}
          multiline
          onChangeText={(description) => setForm((f) => ({ ...f, description }))}
        />
      </View>

      <View className="space-y-1">
        <View>
          <Button isLoading={props.isLoading} onPress={() => props.onSubmit(form)}>
            {task ? "Update" : "Create"}
          </Button>
        </View>
        {formError && (
          <View>
            <FormError error={formError} />
          </View>
        )}
      </View>
    </View>
  )
}

function ElementForm({
  onCreate,
  isLoading,
}: {
  onCreate: (element: { name: string; color: string }) => void
  isLoading: boolean
}) {
  const [elementForm, setElementForm] = React.useState({ name: "", color: randomHexColor() })
  return (
    <View className="space-y-2">
      <View>
        <FormInput label="Name" value={elementForm.name} onChangeText={(name) => setElementForm((f) => ({ ...f, name }))} />
      </View>
      <View>
        <FormInputLabel label="Color" />
        <ColorPicker value={elementForm.color} onChange={(color) => setElementForm((f) => ({ ...f, color: color.hex }))}>
          <Preview hideInitialColor />
          <Panel1 />
          <HueSlider />
        </ColorPicker>
      </View>
      <View>
        <Button isLoading={isLoading} onPress={() => onCreate(elementForm)} disabled={isLoading}>
          Create
        </Button>
      </View>
    </View>
  )
}
