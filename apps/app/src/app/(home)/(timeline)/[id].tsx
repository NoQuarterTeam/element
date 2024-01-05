import dayjs from "dayjs"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, View } from "react-native"

import { join } from "@element/shared"

import { TaskForm } from "../../../components/TaskForm"
import { Text } from "../../../components/Text"
import { Toast } from "../../../components/Toast"
import { useMe } from "../../../lib/hooks/useMe"
import { useTemporaryData } from "../../../lib/hooks/useTemporaryTasks"
import { useTimelineDays } from "../../../lib/hooks/useTimelineDays"
import { api, type RouterInputs, type RouterOutputs } from "../../../lib/utils/api"

type Task = NonNullable<RouterOutputs["task"]["byId"]>
export default function TaskDetail() {
  const { id } = useLocalSearchParams()
  const { me } = useMe()
  const router = useRouter()
  const canGoBack = router.canGoBack()

  const { data, isLoading } = api.task.byId.useQuery({ id: String(id) }, { enabled: !!id && !!me })

  const tempTasks = useTemporaryData((s) => s.tasks)
  const temporaryTask = tempTasks.find((t) => t.id === id)

  return (
    <View className={join("flex-1", canGoBack ? "pt-6" : "pt-16")}>
      {me ? (
        isLoading && !data ? (
          <View className="flex flex-row items-end justify-center pt-6">
            <ActivityIndicator />
          </View>
        ) : !data ? (
          <Text className="pt-6 text-center">Task not found</Text>
        ) : (
          <EditTaskForm task={data} />
        )
      ) : temporaryTask ? (
        <EditTaskForm task={temporaryTask} />
      ) : (
        <Text className="pt-6 text-center">Task not found</Text>
      )}
      <StatusBar style="light" />
      <Toast />
    </View>
  )
}

function EditTaskForm({ task }: { task: Task }) {
  const { me } = useMe()
  const router = useRouter()
  const { daysBack, daysForward } = useTimelineDays()
  const utils = api.useUtils()
  const tempActions = useTemporaryData()

  const update = api.task.update.useMutation({
    onSuccess: (updatedTask) => {
      utils.task.timeline.setData({ daysBack, daysForward }, (old) => {
        if (!old) return old
        return old.map((t) =>
          t.id === task.id
            ? { ...t, ...updatedTask, date: dayjs(updatedTask.date!).startOf("day").add(12, "hours").format("YYYY-MM-DD") }
            : t,
        )
      })
      utils.task.byId.setData({ id: task.id }, updatedTask)
      router.back()
    },
  })

  const handleUpdate = (data: RouterInputs["task"]["update"]) => {
    if (me) {
      update.mutate({
        ...data,
        date: dayjs(data.date as string)
          .startOf("day")
          .add(12, "hours")
          .toISOString(),
        durationHours: Number(data.durationHours),
        durationMinutes: Number(data.durationMinutes),
      })
    } else {
      tempActions.updateTask({
        ...data,
        durationHours: Number(data.durationHours),
        durationMinutes: Number(data.durationMinutes),
      })
      router.back()
    }
  }

  return <TaskForm error={update.error?.data} task={task} onUpdate={handleUpdate} isLoading={update.isLoading} />
}
