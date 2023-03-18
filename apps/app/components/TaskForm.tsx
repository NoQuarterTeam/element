import Feather from "@expo/vector-icons/Feather"
import dayjs from "dayjs"
import { useRouter, useSearchParams } from "expo-router"
import * as React from "react"
import { Modal, TextInput, TouchableOpacity, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { Button } from "./Button"
import { FormInput, FormLabel } from "./FormInput"
import { Input } from "./Input"
import { ModalView } from "./ModalView"
import { api, RouterOutputs } from "../lib/utils/api"
import { Text } from "./Text"

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
  const { data } = api.element.all.useQuery()

  const [isElementModalOpen, setIsElementModalOpen] = React.useState(false)
  const handleShowElementPicker = () => setIsElementModalOpen(true)
  const handleCancelElementPicker = () => setIsElementModalOpen(false)

  const [isTimeModalOpen, setIsTimeModalOpen] = React.useState(false)
  const handleShowTimePicker = () => setIsTimeModalOpen(true)
  const handleCancelTimePicker = () => setIsTimeModalOpen(false)
  const handlePickTime = (startTime: Date) => {
    setIsTimeModalOpen(false)
    setForm((f) => ({ ...f, startTime: dayjs(startTime).format("HH:mm") }))
  }
  const [isDateModalOpen, setIsDateModalOpen] = React.useState(false)
  const handleShowDatePicker = () => setIsDateModalOpen(true)
  const handleCancelDatePicker = () => setIsDateModalOpen(false)
  const handlePickDate = (date: Date) => {
    setIsDateModalOpen(false)
    setForm((f) => ({ ...f, date: dayjs(date).format("YYYY-MM-DD") }))
  }

  return (
    <View className="space-y-2">
      <View className="flex flex-row justify-between">
        <TextInput
          className="font-body w-11/12 text-3xl"
          value={form.name}
          multiline
          placeholder="Name"
          onChangeText={(name) => setForm((f) => ({ ...f, name }))}
        />
        <TouchableOpacity onPress={router.back} className="p-2">
          <Feather name="x" size={24} />
        </TouchableOpacity>
      </View>
      <View>
        <FormInput
          label="Element"
          editable={false}
          value={form.element?.name}
          rightAction={{ icon: <Feather name="edit-2" size={20} />, onPress: handleShowElementPicker }}
        />

        <Modal
          animationType="slide"
          presentationStyle="formSheet"
          visible={isElementModalOpen}
          onDismiss={handleCancelElementPicker}
          onRequestClose={handleCancelElementPicker}
        >
          <ModalView title="Select element" onBack={handleCancelElementPicker}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
              <View className="space-y-2">
                {data?.map((element) => (
                  <TouchableOpacity
                    key={element.id}
                    className="flex flex-row items-center space-x-2 p-1"
                    onPress={() => {
                      setForm((f) => ({ ...f, element }))
                      setIsElementModalOpen(false)
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
          rightAction={{ icon: <Feather name="edit-2" size={20} />, onPress: handleShowDatePicker }}
        />
        <DateTimePickerModal
          isVisible={isDateModalOpen}
          date={dayjs(form.date).toDate()}
          onConfirm={handlePickDate}
          onCancel={handleCancelDatePicker}
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
          rightAction={{ icon: <Feather name="edit-2" size={20} />, onPress: handleShowTimePicker }}
        />
        <DateTimePickerModal
          mode="time"
          isVisible={isTimeModalOpen}
          date={dayjs()
            .set("hour", Number(form.startTime?.split(":")[0] || 12))
            .set("minutes", Number(form.startTime?.split(":")[1] || 0))
            .toDate()}
          onConfirm={handlePickTime}
          onCancel={handleCancelTimePicker}
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
        <Button onPress={() => props.onSubmit(form)}>{props.isLoading ? "Saving..." : task ? "Update" : "Create"}</Button>
      </View>
    </View>
  )
}
