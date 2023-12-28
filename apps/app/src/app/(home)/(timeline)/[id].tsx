import { useGlobalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ScrollView, TouchableOpacity, View } from "react-native"

import { join } from "@element/shared"

import { Clock, Copy, Trash } from "lucide-react-native"
import { Icon } from "../../../components/Icon"
import { TaskForm, type TaskFormData } from "../../../components/TaskForm"
import { api, type RouterOutputs } from "../../../lib/utils/api"
import { useTimelineDays } from "../../../lib/hooks/useTimelineDays"
import { Spinner } from "../../../components/Spinner"
import { Text } from "../../../components/Text"
import { useMe } from "../../../lib/hooks/useMe"
import { useTemporaryData } from "../../../lib/hooks/useTemporaryTasks"
import { Alert } from "react-native"

type Task = NonNullable<RouterOutputs["task"]["byId"]>
export default function TaskDetail() {
  const { id } = useGlobalSearchParams()
  const { me } = useMe()
  const router = useRouter()
  const canGoBack = router.canGoBack()

  const { data, isLoading } = api.task.byId.useQuery({ id: String(id) }, { enabled: !!id && !!me })

  const tempTasks = useTemporaryData((s) => s.tasks)
  const temporaryTask = tempTasks.find((t) => t.id === id)

  return (
    <View className={join("px-4", canGoBack ? "pt-6" : "pt-16")}>
      {me ? (
        isLoading ? (
          <View className="flex flex-row items-end justify-center pt-6">
            <Spinner />
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
    onSuccess: async (updatedTask) => {
      void utils.task.timeline.refetch({ daysBack, daysForward })
      utils.task.byId.setData({ id: task.id }, updatedTask)

      router.back()
    },
  })

  const handleUpdate = (data: TaskFormData) => {
    if (me) {
      update.mutate({
        id: task.id,
        ...data,
        elementId: data.element.id,
        date: data.date,
        durationHours: Number(data.durationHours),
        durationMinutes: Number(data.durationMinutes),
      })
    } else {
      tempActions.updateTask({
        id: task.id,
        ...data,
        elementId: data.element.id,
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
    onSuccess: async () => {
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
      <TaskForm
        formError={update.error?.data?.formError}
        fieldErrors={update.error?.data?.zodError?.fieldErrors}
        task={task}
        onSubmit={handleUpdate}
        isLoading={update.isLoading}
      />
      <View className="flex w-full flex-row items-center justify-between">
        <TouchableOpacity onPress={handleDelete} className="rounded-full border border-gray-100 p-4 dark:border-gray-600">
          <Icon icon={Trash} size={24} color="red" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddToBacklog} className="rounded-full border border-gray-100 p-4 dark:border-gray-600">
          <Icon icon={Clock} size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDuplicate} className="rounded-full border border-gray-100 p-4 dark:border-gray-600">
          <Icon icon={Copy} size={24} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
