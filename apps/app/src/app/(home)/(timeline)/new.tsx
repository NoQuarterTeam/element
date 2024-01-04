import { ScrollView, View } from "react-native"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"

import { join } from "@element/shared"

import { TaskForm } from "../../../components/TaskForm"
import { Toast } from "../../../components/Toast"
import { useMe } from "../../../lib/hooks/useMe"
import { useTemporaryData } from "../../../lib/hooks/useTemporaryTasks"
import { useTimelineDays } from "../../../lib/hooks/useTimelineDays"
import { api, type RouterInputs } from "../../../lib/utils/api"

export default function NewTask() {
  const router = useRouter()
  const { daysBack, daysForward } = useTimelineDays()
  const canGoBack = router.canGoBack()
  const utils = api.useUtils()
  const { me } = useMe()
  const create = api.task.create.useMutation({
    onSuccess: (createdTask) => {
      if (!createdTask.date) return
      utils.task.timeline.setData({ daysBack, daysForward }, (old) => (old ? [...old, createdTask] : [createdTask]))
      router.back()
    },
  })

  const addTempTask = useTemporaryData((s) => s.addTask)
  const handleCreate = (data: RouterInputs["task"]["create"]) => {
    if (me) {
      create.mutate({
        ...data,
        durationHours: Number(data.durationHours),
        durationMinutes: Number(data.durationMinutes),
      })
    } else {
      addTempTask({
        ...data,
        durationHours: Number(data.durationHours),
        durationMinutes: Number(data.durationMinutes),
      })
      router.back()
    }
  }

  return (
    <View className={join("px-4", canGoBack ? "pt-6" : "pt-16")}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 400 }}
        showsVerticalScrollIndicator={false}
      >
        <TaskForm onCreate={handleCreate} error={create.error?.data} isLoading={create.isLoading} />
      </ScrollView>
      <StatusBar style="light" />
      <Toast />
    </View>
  )
}
