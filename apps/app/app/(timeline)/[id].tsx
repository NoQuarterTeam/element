import dayjs from "dayjs"
import { useRouter, useSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { KeyboardAvoidingView, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { TaskForm, TaskFormData } from "../../components/TaskForm"
import { api, RouterOutputs } from "../../lib/utils/api"

type Task = NonNullable<RouterOutputs["task"]["byId"]>
export default function TaskDetail() {
  const { id } = useSearchParams()

  const { data, isLoading } = api.task.byId.useQuery(id as string)

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
    onSuccess: (updatedTask) => {
      const oldTasks = utils.task.byDate.getData(dayjs(updatedTask.date).format("YYYY-MM-DD")) || []
      if (dayjs(updatedTask.date).isSame(dayjs(task.date), "date")) {
        utils.task.byDate.setData(dayjs(updatedTask.date).format("YYYY-MM-DD"), () =>
          oldTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)).sort((a, b) => a.order - b.order),
        )
      } else {
        utils.task.byDate.setData(dayjs(task.date).format("YYYY-MM-DD"), () => oldTasks.filter((t) => t.id !== updatedTask.id))
      }
      utils.task.byId.setData(task.id, updatedTask)
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

  return (
    <KeyboardAvoidingView behavior="padding" enabled keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={{ minHeight: "100%", paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <TaskForm
          formError={update.error?.data?.formError}
          fieldErrors={update.error?.data?.zodError?.fieldErrors}
          task={task}
          onSubmit={handleUpdate}
          isLoading={update.isLoading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
