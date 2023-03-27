import dayjs from "dayjs"
import Feather from "@expo/vector-icons/Feather"
import { useRouter, useSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { KeyboardAvoidingView, TouchableOpacity, useColorScheme, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { TaskForm, TaskFormData } from "../../components/TaskForm"
import { api, RouterOutputs } from "../../lib/utils/api"
import colors from "@element/tailwind-config/colors"

type Task = NonNullable<RouterOutputs["task"]["byId"]>
export default function TaskDetail() {
  const { id } = useSearchParams()
  if (typeof id !== "string") throw new Error("ID required")

  const { data, isLoading } = api.task.byId.useQuery({ id })

  return (
    <View className="px-4 pt-6">
      {isLoading || !data ? null : <EditTaskForm task={data} />}
      <StatusBar style="light" />
    </View>
  )
}

function EditTaskForm({ task }: { task: Task }) {
  const router = useRouter()

  const utils = api.useContext()
  const update = api.task.update.useMutation({
    onSuccess: async (updatedTask) => {
      void utils.task.byDate.invalidate({ date: dayjs(updatedTask.date).format("YYYY-MM-DD") })
      if (!dayjs(updatedTask.date).isSame(dayjs(task.date), "date")) {
        void utils.task.byDate.invalidate({ date: dayjs(task.date).format("YYYY-MM-DD") })
      }
      utils.task.byId.setData({ id: task.id }, updatedTask)
      router.back()
    },
  })

  const handleUpdate = (updateTask: TaskFormData) => {
    update.mutate({
      id: task.id,
      ...updateTask,
      elementId: updateTask.element.id,
      date: updateTask.date,
      durationHours: Number(updateTask.durationHours),
      durationMinutes: Number(updateTask.durationMinutes),
    })
  }

  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      void utils.task.byDate.invalidate({ date: dayjs(task.date).format("YYYY-MM-DD") })
      router.back()
    },
  })
  const handleDelete = () => deleteTask.mutate({ id: task.id })

  const addToBacklog = api.task.update.useMutation({
    onSuccess: async (updatedTask) => {
      void utils.task.byDate.invalidate({ date: dayjs(task.date).format("YYYY-MM-DD") })
      utils.task.byId.setData({ id: task.id }, updatedTask)
      router.back()
    },
  })
  const handleAddToBacklog = () => addToBacklog.mutate({ id: task.id, date: null })

  const duplicate = api.task.duplicate.useMutation({
    onSuccess: async () => {
      void utils.task.byDate.invalidate({ date: dayjs(task.date).format("YYYY-MM-DD") })
      router.back()
    },
  })
  const handleDuplicate = () => duplicate.mutate({ id: task.id })

  const colorScheme = useColorScheme()

  return (
    <KeyboardAvoidingView behavior="padding" enabled keyboardVerticalOffset={100}>
      <ScrollView
        className="space-y-4"
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 100 }}
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
            <Feather name="trash" size={24} color={colors.red[500]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddToBacklog} className="rounded-full border border-gray-100 p-4 dark:border-gray-600">
            <Feather name="clock" size={24} color={colorScheme === "dark" ? "white" : "black"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDuplicate} className="rounded-full border border-gray-100 p-4 dark:border-gray-600">
            <Feather name="copy" size={24} color={colorScheme === "dark" ? "white" : "black"} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
