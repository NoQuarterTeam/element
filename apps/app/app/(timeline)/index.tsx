import * as React from "react"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import { Link, useRouter } from "expo-router"
import { View, TouchableOpacity, Dimensions, useColorScheme } from "react-native"
import { api, RouterOutputs } from "../../lib/utils/api"

import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist"
import Ionicons from "@expo/vector-icons/Ionicons"
import Feather from "@expo/vector-icons/Feather"
import { safeReadableColor, formatDuration, join } from "@element/shared"

import { Text } from "../../components/Text"
import { Heading } from "../../components/Heading"

dayjs.extend(advancedFormat)

export default function Timeline() {
  const [date, setDate] = React.useState(dayjs().format("YYYY-MM-DD"))
  const { data: taskData, isLoading } = api.task.byDate.useQuery(date)
  const utils = api.useContext()
  const router = useRouter()
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

  const colorScheme = useColorScheme()
  return (
    <View className="flex-1">
      <View className="border-gray-75 border-b px-4 pb-2 pt-16 dark:border-gray-600">
        <View className="flex w-full flex-row items-center justify-between pb-3">
          <Heading className="text-4xl">Timeline</Heading>
          <TouchableOpacity onPress={() => router.push("/profile")} className="p-2">
            <Feather name="user" size={24} color={colorScheme === "dark" ? "white" : "black"} />
          </TouchableOpacity>
        </View>
        <View className="flex w-full flex-row items-center justify-between">
          <View>
            <TouchableOpacity
              onPress={() => setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"))}
              className="rounded-full border border-gray-100 p-3 dark:border-gray-500"
            >
              <Ionicons name="chevron-back" color={colorScheme === "dark" ? "white" : "black"} />
            </TouchableOpacity>
          </View>
          <Text className="flex-1 text-center text-lg">{dateLabel}</Text>
          <View>
            <TouchableOpacity
              onPress={() => setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"))}
              className="flex items-end rounded-full border border-gray-100 p-3 dark:border-gray-500"
            >
              <Ionicons name="chevron-forward" color={colorScheme === "dark" ? "white" : "black"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View>
        {taskData?.length === 0 ? (
          <Text className="flex py-10 text-center">Nothing planned</Text>
        ) : isLoading || !taskData ? null : (
          <TaskList key={date} tasks={taskData} />
        )}
      </View>
      <View className="absolute bottom-5 left-5 space-y-2">
        <TouchableOpacity
          onPress={() => setDate(dayjs().format("YYYY-MM-DD"))}
          className="rounded-full bg-gray-100/90 p-4 dark:bg-gray-500/90"
        >
          <Feather name="calendar" size={24} />
        </TouchableOpacity>
      </View>
      <View className="absolute bottom-5 right-5 space-y-2">
        <Link href={`new?date=${date}`} asChild>
          <TouchableOpacity className="bg-primary-500/90 rounded-full p-4 ">
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
      contentContainerStyle={{ paddingBottom: 130, paddingTop: 10 }}
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
  const [isHovered, setIsHovered] = React.useState(false)
  const { mutate: toggleComplete } = api.task.toggleComplete.useMutation({ onMutate: onToggleComplete })
  const handleToggleComplete = () => toggleComplete(task.id)
  const router = useRouter()

  const colorScheme = useColorScheme()

  return (
    <ScaleDecorator activeScale={1.01}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: "index", params: { id: task.id } })}
        onLongPress={drag}
        onPressIn={() => setIsHovered(true)}
        onPressOut={() => setIsHovered(false)}
        delayLongPress={400}
        disabled={isActive}
        className="mx-4 mt-1 mb-px bg-white dark:bg-black"
      >
        <View
          className={join(
            "overflow-hidden rounded-sm border border-gray-100 bg-white dark:border-gray-600 dark:bg-black",
            task.isComplete && "opacity-50",
          )}
        >
          <View className="flex flex-row justify-between p-2">
            <View className="flex-1">
              <Text className="text-md" style={{ textDecorationLine: task.isComplete ? "line-through" : undefined }}>
                {task.name}
              </Text>
              {!task.isComplete && (
                <View className="flex flex-row items-center space-x-2">
                  {task.startTime ? <Text className="text-xs">{task.startTime}</Text> : null}
                  {task.durationHours || task.durationMinutes ? (
                    <Text className="text-xs">{formatDuration(task.durationHours, task.durationMinutes)}</Text>
                  ) : null}
                </View>
              )}
            </View>

            <TouchableOpacity onPress={handleToggleComplete} className="flex-shrink-0">
              {task.isComplete ? (
                <Ionicons name="checkbox" size={24} color="#E87B35" />
              ) : (
                <Ionicons name="square-outline" size={24} color={colorScheme === "dark" ? "#777" : "#aaa"} />
              )}
            </TouchableOpacity>
          </View>
          <View style={{ backgroundColor: task.element.color }} className="rounded-b-sm p-1">
            {isHovered || isActive ? (
              <Text style={{ color: safeReadableColor(task.element.color) }} className="text-xs">
                {task.element.name}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  )
}
