import { useGlobalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { KeyboardAvoidingView, ScrollView, View } from "react-native"

import { TaskForm, TaskFormData } from "../../../components/TaskForm"
import { api } from "../../../lib/utils/api"
import { join } from "@element/shared"

export default function NewTask() {
  const router = useRouter()
  const { date } = useGlobalSearchParams()

  const canGoBack = router.canGoBack()
  const utils = api.useUtils()
  const create = api.task.create.useMutation({
    onSuccess: (createdTask) => {
      if (!date) return
      if (!createdTask.date) return
      utils.task.byDate.setData(undefined, (old) => (old ? [...old, createdTask] : [createdTask]))
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
    <View className={join("px-4", canGoBack ? "pt-6" : "pt-16")}>
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
