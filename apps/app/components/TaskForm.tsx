import Feather from "@expo/vector-icons/Feather"
import dayjs from "dayjs"
import { useRouter, useSearchParams } from "expo-router"
import * as React from "react"
import { Modal, TextInput, TouchableOpacity, useColorScheme, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import ColorPicker, { Panel1, HueSlider } from "reanimated-color-picker"

import { Button } from "./Button"
import { FormInput, FormLabel } from "./FormInput"
import { Input } from "./Input"
import { ModalView } from "./ModalView"
import { api, RouterOutputs } from "../lib/utils/api"
import { Text } from "./Text"
import { randomHexColor, useDisclosure } from "@element/shared"

type Task = NonNullable<RouterOutputs["task"]["byId"]>

export type TaskFormData = {
  name: string
  description: string | undefined
  startTime: string | undefined
  durationHours: string | undefined
  durationMinutes: string | undefined
  date: string | undefined
  element: {
    id: string
    name: string
    color: string
  }
}
interface Props {
  isLoading: boolean
  task?: Task
  onSubmit: (data: TaskFormData) => void
}

export function TaskForm({ task, ...props }: Props) {
  const router = useRouter()
  const { date } = useSearchParams()

  const [form, setForm] = React.useState<TaskFormData>({
    name: task?.name || "",
    description: task?.description || "",
    startTime: task?.startTime || "",
    durationHours: task?.durationHours?.toString() || "",
    durationMinutes: task?.durationMinutes?.toString() || "",
    date: task?.date || (date as string | undefined) || "",
    element: task?.element || {
      id: "",
      name: "",
      color: "",
    },
  })
  const utils = api.useContext()

  const { data } = api.element.all.useQuery()

  const elementCreateModalProps = useDisclosure()
  const createElement = api.element.create.useMutation()
  const handleCreateElement = async (element: { name: string; color: string }) => {
    createElement.mutate(element, {
      onSuccess: (data) => {
        setForm((f) => ({ ...f, element: { id: data.id, name: data.name, color: data.color } }))
        elementCreateModalProps.onClose()
        utils.element.all.invalidate()
      },
    })
  }
  const elementModalProps = useDisclosure()

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
  const colorScheme = useColorScheme()

  return (
    <View className="space-y-2">
      <View className="flex flex-row justify-between">
        <TextInput
          className="font-heading w-11/12 text-3xl dark:text-white"
          value={form.name}
          multiline
          placeholderTextColor={colorScheme === "dark" ? "#444" : "#ccc"}
          placeholder="Name"
          onChangeText={(name) => setForm((f) => ({ ...f, name }))}
        />
        <TouchableOpacity onPress={router.back} className="p-2">
          <Feather name="x" size={24} color={colorScheme === "dark" ? "white" : "black"} />
        </TouchableOpacity>
      </View>
      <View>
        <FormInput
          label="Element"
          editable={false}
          value={form.element?.name}
          rightElement={
            <View className="flex flex-row space-x-2">
              <TouchableOpacity
                onPress={elementCreateModalProps.onOpen}
                className="border border-gray-100 p-2.5 dark:border-gray-600"
              >
                <Feather name="plus" size={20} color={colorScheme === "dark" ? "white" : "black"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={elementModalProps.onOpen} className="border border-gray-100 p-2.5 dark:border-gray-600">
                <Feather name="edit-2" size={20} color={colorScheme === "dark" ? "white" : "black"} />
              </TouchableOpacity>
            </View>
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
            <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
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
            <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 0 }} showsVerticalScrollIndicator={false}>
              <View className="space-y-2">
                {data?.map((element) => (
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
          editable={false}
          value={dayjs(form.date).format("DD/MM/YYYY")}
          rightElement={
            <TouchableOpacity onPress={dateProps.onOpen} className="border border-gray-100 p-2.5 dark:border-gray-600">
              <Feather name="edit-2" size={20} color={colorScheme === "dark" ? "white" : "black"} />
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
        <FormLabel label="Duration" />
        <View className="flex flex-row items-center space-x-3">
          <View className="flex flex-row items-center space-x-2">
            <Input
              className="w-11 px-1 text-center"
              value={form.durationHours}
              keyboardType="number-pad"
              onChangeText={(durationHours) => setForm((f) => ({ ...f, durationHours }))}
            />
            <Text className="opacity-70">Hours</Text>
          </View>
          <View className="flex flex-row items-center space-x-2">
            <Input
              className="w-11 px-1 text-center"
              value={form.durationMinutes}
              keyboardType="number-pad"
              onChangeText={(durationMinutes) => setForm((f) => ({ ...f, durationMinutes }))}
            />
            <Text className="opacity-70">Minutes</Text>
          </View>
        </View>
      </View>
      <View>
        <FormInput
          label="Start time"
          editable={false}
          value={form.startTime}
          rightElement={
            <TouchableOpacity onPress={timeProps.onOpen} className="border border-gray-100 p-2.5 dark:border-gray-600">
              <Feather name="edit-2" size={20} color={colorScheme === "dark" ? "white" : "black"} />
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
          label="Description"
          value={form.description}
          multiline
          onChangeText={(description) => setForm((f) => ({ ...f, description }))}
        />
      </View>

      <View>
        <Button isLoading={props.isLoading} onPress={() => props.onSubmit(form)}>
          {task ? "Update" : "Create"}
        </Button>
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
        <FormLabel label="Color" />
        <ColorPicker
          style={{ width: "100%" }}
          value={elementForm.color}
          onComplete={(color) => setElementForm((f) => ({ ...f, color: color.hex }))}
        >
          <Panel1 />
          <HueSlider />
        </ColorPicker>
      </View>
      <View>
        <Button onPress={() => onCreate(elementForm)} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create"}
        </Button>
      </View>
    </View>
  )
}
