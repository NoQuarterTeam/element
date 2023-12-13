import dayjs from "dayjs"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { KeyboardAvoidingView, ScrollView, View } from "react-native"

import { TaskForm, TaskFormData } from "../../components/TaskForm"
import { api } from "../../lib/utils/api"

export default function NewTask() {
  const router = useRouter()

  const utils = api.useUtils()
  const create = api.task.create.useMutation({
    onSuccess: (createdTask) => {
      if (!createdTask.date) return
      utils.task.byDate.setData({ date: dayjs().toDate() }, (old) =>
        old
          ? [...old, { ...createdTask, date: dayjs(createdTask.date).format("YYYY-MM-DD") }]
          : [{ ...createdTask, date: dayjs(createdTask.date).format("YYYY-MM-DD") }],
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
      <KeyboardAvoidingView behavior="height" enabled keyboardVerticalOffset={0}>
        <ScrollView className="space-y-4" contentContainerStyle={{ minHeight: "100%" }} showsVerticalScrollIndicator={false}>
          <TaskForm
            onSubmit={handleCreate}
            formError={create.error?.data?.formError}
            fieldErrors={create.error?.data?.zodError?.fieldErrors}
            isLoading={create.isLoading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <StatusBar style="light" />
    </View>
  )
}
