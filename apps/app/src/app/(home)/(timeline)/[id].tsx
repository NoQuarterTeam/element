import { ActivityIndicator, ScrollView, TouchableOpacity, View } from "react-native"
import { Alert } from "react-native"
import dayjs from "dayjs"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Clock, Copy, Trash } from "lucide-react-native"

import { join } from "@element/shared"

import { Icon } from "../../../components/Icon"
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
    <View className={join("px-4", canGoBack ? "pt-6" : "pt-16")}>
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

  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      void utils.task.timeline.refetch({ daysBack, daysForward })
      router.back()
    },
  })
  const handleDelete = () => {
    if (me) {
      deleteTask.mutate({ id: task.id })
    } else {
      tempActions.deleteTask(task.id)
      router.back()
    }
  }

  const addToBacklog = api.task.update.useMutation({
    onSuccess: async (updatedTask) => {
      void utils.task.timeline.refetch({ daysBack, daysForward })
      void utils.task.backlog.refetch()
      utils.task.byId.setData({ id: task.id }, updatedTask)
      router.back()
    },
  })
  const handleAddToBacklog = () => {
    if (!me) return Alert.alert("You must have an account to add a task to the backlog")
    addToBacklog.mutate({ id: task.id, date: null, isComplete: false })
  }

  const duplicate = api.task.duplicate.useMutation({
    onSuccess: () => {
      // have to refetch to get the new order, or would have to calculate here
      void utils.task.timeline.refetch({ daysBack, daysForward })
      router.back()
    },
  })
  const handleDuplicate = () => {
    if (me) {
      duplicate.mutate({ id: task.id })
    } else {
      tempActions.addTask({ ...task, elementId: task.element.id })
      router.back()
    }
  }

  return (
    <ScrollView
      className="space-y-4"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ minHeight: "100%", paddingBottom: 400 }}
      showsVerticalScrollIndicator={false}
    >
      <TaskForm error={update.error?.data} task={task} onUpdate={handleUpdate} isLoading={update.isLoading} />
      <View className="flex w-full flex-row items-center justify-between">
        <TouchableOpacity
          onPress={handleDelete}
          className="sq-14 flex items-center justify-center rounded-full border border-gray-100 dark:border-gray-600"
        >
          {deleteTask.isLoading ? <ActivityIndicator /> : <Icon icon={Trash} size={24} color="red" />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAddToBacklog}
          className="sq-14 flex items-center justify-center rounded-full border border-gray-100 dark:border-gray-600"
        >
          {addToBacklog.isLoading ? <ActivityIndicator /> : <Icon icon={Clock} size={24} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDuplicate}
          className="sq-14 flex items-center justify-center rounded-full border border-gray-100 dark:border-gray-600"
        >
          {duplicate.isLoading ? <ActivityIndicator /> : <Icon icon={Copy} size={24} />}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
