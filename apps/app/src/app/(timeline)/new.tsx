import dayjs from "dayjs"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { View } from "react-native"

import { TaskForm, TaskFormData } from "../../components/TaskForm"
import { api } from "../../lib/utils/api"

export default function NewTask() {
  const router = useRouter()

  const utils = api.useContext()
  const create = api.task.create.useMutation({
    onSuccess: (createdTask) => {
      utils.task.byDate.setData({ date: dayjs(createdTask.date).format("YYYY-MM-DD") }, (old) =>
        old ? [...old, createdTask] : [createdTask],
      )
      router.back()
    },
  })

  const handleCreate = (data: TaskFormData) => {
    if (!data.element) return
    create.mutate({
      ...data,
      elementId: data.element.id,
      durationHours: Number(data.durationHours),
      durationMinutes: Number(data.durationMinutes),
    })
  }

  return (
    <View className="px-4 pt-6">
      <TaskForm
        onSubmit={handleCreate}
        formError={create.error?.data?.formError}
        fieldErrors={create.error?.data?.zodError?.fieldErrors}
        isLoading={create.isLoading}
      />
      <StatusBar style="light" />
    </View>
  )
}
