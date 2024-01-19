import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"

import { TaskForm } from "~/components/TaskForm"
import { Toast } from "~/components/Toast"
import { useMe } from "~/lib/hooks/useMe"
import { useTemporaryData } from "~/lib/hooks/useTemporaryTasks"
import { useTimelineDays } from "~/lib/hooks/useTimeline"
import { api, type RouterInputs } from "~/lib/utils/api"

export default function NewTask() {
  const router = useRouter()
  const { daysBack, daysForward } = useTimelineDays()

  const utils = api.useUtils()
  const { me } = useMe()
  const create = api.task.create.useMutation({
    onSuccess: async (createdTask) => {
      if (!createdTask.date) return
      // TODO: set to timeline data with correct order, instead of refetching
      await utils.task.timeline.refetch({ daysBack, daysForward })
      router.back()
    },
  })

  const addTempTask = useTemporaryData((s) => s.addTask)
  const handleCreate = (data: RouterInputs["task"]["create"]) => {
    if (me) {
      create.mutate(data)
    } else {
      addTempTask(data)
      router.back()
    }
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 pt-4">
        <TaskForm onCreate={handleCreate} error={create.error?.data} isLoading={create.isLoading} />
        <StatusBar style="light" />
        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
