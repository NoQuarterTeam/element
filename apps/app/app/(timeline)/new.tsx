import { useRouter, useSearchParams } from "expo-router"
import * as React from "react"
import { Picker } from "@react-native-picker/picker"
import { View } from "react-native"
import { Button } from "../../components/Button"
import { Input } from "../../components/Input"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { Modal } from "../../components/Modal"
import { api } from "../../lib/utils/api"
import dayjs from "dayjs"

export default function NewTask() {
  const { data } = api.element.all.useQuery()
  const { date } = useSearchParams()

  const [isDateModalOpen, setIsDateModalOpen] = React.useState(false)
  const handleShowDatePicker = () => setIsDateModalOpen(true)
  const handleCancelDatePicker = () => setIsDateModalOpen(false)
  const handlePickDate = (date: Date) => {
    setIsDateModalOpen(false)
    setForm((f) => ({ ...f, date: dayjs(date).format("YYYY-MM-DD") }))
  }

  const [form, setForm] = React.useState({
    name: "",
    description: "",
    startTime: "",
    durationHours: "",
    durationMinutes: "",
    date: date as string,
    elementId: "",
  })
  const router = useRouter()

  const utils = api.useContext()
  const create = api.task.create.useMutation({
    onSuccess: (task) => {
      utils.task.byDate.setData(dayjs(form.date).format("YYYY-MM-DD"), (old) => (old ? [...old, task] : [task]))
      router.back()
    },
  })

  const handleCreate = () => {
    create.mutate({
      ...form,
      durationHours: form.durationHours ? Number(form.durationHours) : undefined,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
    })
  }

  return (
    <Modal title="New task">
      <View className="space-y-2">
        <Input placeholder="Name" autoFocus onChangeText={(name) => setForm((f) => ({ ...f, name }))} />
        <Input multiline placeholder="Description" onChangeText={(description) => setForm((f) => ({ ...f, description }))} />
        <Input placeholder="Start time" onChangeText={(startTime) => setForm((f) => ({ ...f, startTime }))} />
        <Input
          placeholder="Duration hours"
          keyboardType="number-pad"
          onChangeText={(durationHours) => setForm((f) => ({ ...f, durationHours }))}
        />
        <Input
          placeholder="Duration minutes"
          keyboardType="number-pad"
          onChangeText={(durationMinutes) => setForm((f) => ({ ...f, durationMinutes }))}
        />
        <Input value={dayjs(form.date).format("DD/MM/YYYY")} onPressIn={handleShowDatePicker} />
        <DateTimePickerModal
          isVisible={isDateModalOpen}
          date={dayjs(form.date).toDate()}
          onConfirm={handlePickDate}
          onCancel={handleCancelDatePicker}
        />
        <Picker selectedValue={form.elementId} onValueChange={(itemValue) => setForm((f) => ({ ...f, elementId: itemValue }))}>
          {data?.map((element) => (
            <Picker.Item key={element.id} label={element.name} value={element.id} />
          ))}
        </Picker>
        <Button onPress={handleCreate}>Save</Button>
      </View>
    </Modal>
  )
}
