import dayjs from "dayjs"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, View } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"

import { TaskForm } from "~/components/TaskForm"
import { Text } from "~/components/Text"
import { Toast } from "~/components/Toast"
import { useMe } from "~/lib/hooks/useMe"
import { useTemporaryData } from "~/lib/hooks/useTemporaryTasks"
import { useTimelineDays } from "~/lib/hooks/useTimeline"
import { type RouterInputs, type RouterOutputs, api } from "~/lib/utils/api"

type Task = NonNullable<RouterOutputs["task"]["byId"]>

export default function TaskDetail() {
  const { id } = useLocalSearchParams()
  const { me } = useMe()

  const { data, isLoading } = api.task.byId.useQuery({ id: String(id) }, { enabled: !!id && !!me })

  const tempTasks = useTemporaryData((s) => s.tasks)
  const temporaryTask = tempTasks.find((t) => t.id === id)

  return (
    <SafeAreaProvider className="flex-1">
      <SafeAreaView className="flex-1 pt-4">
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
      </SafeAreaView>
    </SafeAreaProvider>
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
      const date = updatedTask.date
      if (date) {
        utils.task.timeline.setData({ daysBack, daysForward }, (old) => {
          if (!old) return old
          // gota keep the old order as thats never manually updated
          return old.map((t) => (t.id === task.id ? { ...t, ...updatedTask, order: t.order, date } : t))
        })
      }
      utils.task.byId.setData({ id: task.id }, updatedTask)
      router.back()
    },
  })

  const handleUpdate = (data: RouterInputs["task"]["update"]) => {
    if (me) {
      update.mutate({
        ...data,
        date: data.date
          ? dayjs(data.date as string)
              .startOf("day")
              .add(12, "hours")
              .toISOString()
          : undefined,
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
