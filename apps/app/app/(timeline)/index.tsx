import * as React from "react"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import { Link, useRouter } from "expo-router"
import { Text, View, TouchableOpacity, Dimensions, RefreshControl } from "react-native"
import { api, RouterOutputs } from "../../lib/utils/api"

import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist"
import { join } from "../../lib/tailwind"
import Ionicons from "@expo/vector-icons/Ionicons"
import Feather from "@expo/vector-icons/Feather"

dayjs.extend(advancedFormat)

export default function Timeline() {
  const [date, setDate] = React.useState(dayjs().format("YYYY-MM-DD"))
  const { data: taskData, isLoading } = api.task.byDate.useQuery(date)
  const utils = api.useContext()
  const dateLabel = dayjs(date).isSame(dayjs(), "date")
    ? "Today"
    : // if yesterday
    dayjs(date).isSame(dayjs().subtract(1, "day"), "date")
    ? "Yesterday"
    : // if tomorrow
    dayjs(date).isSame(dayjs().add(1, "day"), "date")
    ? "Tomorrow"
    : dayjs(date).format("ddd Do MMMM")

  React.useEffect(() => {
    // prefetch next and previous dates
    utils.task.byDate.prefetch(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"))
    utils.task.byDate.prefetch(dayjs(date).add(1, "day").format("YYYY-MM-DD"))
  }, [date])
  return (
    <View className="flex-1">
      <View className="border-gray-75 border-b px-4 py-2 pt-16">
        <View className="flex w-full flex-row items-center justify-between pb-2">
          <Text className="pb-2 text-3xl font-extrabold">Timeline</Text>
          <Link href="/profile" asChild>
            <TouchableOpacity>
              <Feather name="user" size={24} />
            </TouchableOpacity>
          </Link>
        </View>
        <View className="flex w-full flex-row items-center justify-between">
          <View>
            <TouchableOpacity
              onPress={() => setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"))}
              className="rounded-full border border-gray-100 p-3"
            >
              <Ionicons name="chevron-back" />
            </TouchableOpacity>
          </View>
          <Text className="flex-1 text-center text-lg">{dateLabel}</Text>
          <View>
            <TouchableOpacity
              onPress={() => setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"))}
              className="flex items-end rounded-full border border-gray-100 p-3"
            >
              <Ionicons name="chevron-forward" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View>
        {taskData?.length === 0 ? (
          <Text className="flex py-10 text-center">No tasks</Text>
        ) : isLoading || !taskData ? null : (
          <TaskList key={date} tasks={taskData} />
        )}
      </View>
      <View className="absolute bottom-4 right-4">
        <Link href={`/new?date=${date}`} asChild>
          <TouchableOpacity className="bg-primary-500 rounded-full p-4 shadow-lg">
            <Feather name="plus" size={24} />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  )
}

const height = Dimensions.get("screen").height

type Tasks = NonNullable<RouterOutputs["task"]["byDate"]>

function TaskList({ tasks }: { tasks: Tasks }) {
  const [data, setData] = React.useState(tasks)

  React.useEffect(() => {
    setData(tasks)
  }, [tasks])

  const handleToggle = (id: string) => {
    setData(data.map((task) => (task.id === id ? { ...task, isComplete: !task.isComplete } : task)))
  }
  const { mutate: updateOrder } = api.task.updateOrder.useMutation()
  const handleUpdateOrder = (data: Tasks) => {
    setData(data)
    updateOrder(data.map((task) => task.id))
  }
  return (
    <DraggableFlatList
      data={data}
      // refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefetch} />}
      onDragEnd={({ data }) => handleUpdateOrder(data)}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 130 }}
      containerStyle={{ height: height - 180 }}
      renderItem={({ item, drag, isActive }) => (
        <TaskItem onToggleComplete={() => handleToggle(item.id)} task={item} drag={drag} isActive={isActive} />
      )}
    />
  )
}

function TaskItem({
  task,
  drag,
  onToggleComplete,
  isActive,
}: {
  task: Tasks[number]
  onToggleComplete: () => void
  drag: () => void
  isActive: boolean
}) {
  const { mutate: toggleComplete } = api.task.toggleComplete.useMutation({ onMutate: onToggleComplete })
  const handleToggleComplete = () => toggleComplete(task.id)
  const router = useRouter()
  return (
    <ScaleDecorator activeScale={1.02}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: "index", params: { id: task.id } })}
        onLongPress={drag}
        delayLongPress={100}
        disabled={isActive}
        className={join(
          "mx-4 mt-2 flex flex-row items-center justify-between rounded-md border border-gray-100 bg-white p-2",
          isActive && "shadow-md",
        )}
      >
        <Text className="text-lg">{task.name}</Text>
        <TouchableOpacity onPress={handleToggleComplete}>
          {task.isComplete ? <Feather name="check-square" size={24} /> : <Feather name="square" size={24} />}
        </TouchableOpacity>
      </TouchableOpacity>
    </ScaleDecorator>
  )
}
