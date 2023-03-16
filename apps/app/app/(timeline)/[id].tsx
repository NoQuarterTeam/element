import { useRouter, useSearchParams } from "expo-router"
import { Modal } from "../../components/Modal"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { Picker } from "@react-native-picker/picker"
import { api, RouterOutputs } from "../../lib/utils/api"
import * as React from "react"
import { Text, View } from "react-native"
import { Input } from "../../components/Input"
import dayjs from "dayjs"
import { Button } from "../../components/Button"

type Task = NonNullable<RouterOutputs["task"]["byId"]>
export default function TaskDetail() {
  const { id } = useSearchParams()

  const { data, isLoading } = api.task.byId.useQuery(id as string)

  return <Modal title={data?.name || ""}>{isLoading || !data ? <Text>Loading</Text> : <TaskForm task={data} />}</Modal>
}

function TaskForm({ task }: { task: Task }) {
  const [form, setForm] = React.useState({
    name: task.name,
    description: task.description || "",
    startTime: task.startTime || "",
    durationHours: task.durationHours?.toString() || "",
    durationMinutes: task.durationMinutes?.toString() || "",
    date: task.date,
    elementId: task.elementId,
  })
  const { data } = api.element.all.useQuery()

  const [isDateModalOpen, setIsDateModalOpen] = React.useState(false)
  const handleShowDatePicker = () => setIsDateModalOpen(true)
  const handleCancelDatePicker = () => setIsDateModalOpen(false)
  const handlePickDate = (date: Date) => {
    setIsDateModalOpen(false)
    setForm((f) => ({ ...f, date: dayjs(date).format("YYYY-MM-DD") }))
  }

  const router = useRouter()

  const utils = api.useContext()
  const update = api.task.update.useMutation({
    onSuccess: (task) => {
      utils.task.byDate.setData(dayjs(form.date).format("YYYY-MM-DD"), (old) =>
        old ? old.map((t) => (t.id === task.id ? task : t)) : [task],
      )
      utils.task.byId.setData(task.id, task)
      router.back()
    },
  })

  const handleUpdate = () => {
    update.mutate({
      id: task.id,
      data: {
        ...form,
        date: form.date || undefined,
        durationHours: form.durationHours ? Number(form.durationHours) : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      },
    })
  }

  return (
    <View className="space-y-2">
      <Input value={form.name} placeholder="Name" autoFocus onChangeText={(name) => setForm((f) => ({ ...f, name }))} />
      <Input
        value={form.description}
        multiline
        placeholder="Description"
        onChangeText={(description) => setForm((f) => ({ ...f, description }))}
      />
      <Input
        value={form.startTime}
        placeholder="Start time"
        onChangeText={(startTime) => setForm((f) => ({ ...f, startTime }))}
      />
      <Input
        value={form.durationHours}
        placeholder="Duration hours"
        keyboardType="number-pad"
        onChangeText={(durationHours) => setForm((f) => ({ ...f, durationHours }))}
      />
      <Input
        value={form.durationMinutes}
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
      <Button onPress={handleUpdate}>{update.isLoading ? "Saving..." : "Update"}</Button>
    </View>
  )
}
