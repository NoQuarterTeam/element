import * as React from "react"
import dayjs, { Dayjs } from "dayjs"

import advancedFormat from "dayjs/plugin/advancedFormat"
import * as Progress from "react-native-progress"
import { Link, router, useRouter } from "expo-router"
import { View, TouchableOpacity, useColorScheme, ScrollView } from "react-native"
import { api, RouterOutputs } from "../../../lib/utils/api"
import * as Haptics from "expo-haptics"
// import Ionicons from "@expo/vector-icons/Ionicons"

import { safeReadableColor, join } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { Text } from "../../../components/Text"
import { Heading } from "../../../components/Heading"

import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  SharedValue,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { height } from "../../../lib/utils/device"
import { Icon } from "../../../components/Icon"
import { Calendar, Plus } from "lucide-react-native"

dayjs.extend(advancedFormat)

// const MONTH_NAMES = ["jan.", "feb.", "mar.", "apr.", "may.", "jun.", "jul.", "aug.", "sept.", "oct.", "nov.", "dec."]

export default function Timeline() {
  const [date, _setDate] = React.useState(dayjs().startOf("day").toDate())
  const { data: taskData, isLoading } = api.task.byDate.useQuery({ date }, { staleTime: 10000 })
  // const dateLabel = dayjs(date).isSame(dayjs(), "date")
  //   ? "Today"
  //   : // if yesterday
  //     dayjs(date).isSame(dayjs().subtract(1, "day"), "date")
  //     ? "Yesterday"
  //     : // if tomorrow
  //       dayjs(date).isSame(dayjs().add(1, "day"), "date")
  //       ? "Tomorrow"
  //       : dayjs(date).format("ddd Do MMMM")

  // const utils = api.useUtils()

  // React.useEffect(() => {
  //   // prefetch next and previous dates
  //   utils.task.byDate.prefetch({ date: dayjs(date).subtract(1, "day").format("YYYY-MM-DD") })
  //   utils.task.byDate.prefetch({ date: dayjs(date).add(1, "day").format("YYYY-MM-DD") })
  //   utils.habit.progressCompleteByDate.prefetch({ date: dayjs(date).subtract(1, "day").format("YYYY-MM-DD") })
  // }, [date])

  // const { features } = useFeatures()

  // const monthValue = useSharedValue(0)

  const timelineRef = useAnimatedRef<ScrollView>()
  // const timelineX = useScrollViewOffset(timelineRef)
  // const timelineScroll = useSharedValue(0)

  // useAnimatedStyle(() => {
  //   console.log(timelineX.value)
  //   return {}
  // })

  const isDark = useColorScheme() === "dark"
  const days = React.useMemo(() => getDays(dayjs().subtract(0, "day"), 30), [])

  return (
    <View className="flex-1">
      <View className="flex w-full flex-row items-center justify-between px-4 pt-16">
        <Heading className="text-4xl">dec</Heading>
      </View>

      <View>
        <ScrollView ref={timelineRef} horizontal contentContainerStyle={{ height: 1000 }}>
          <View className="relative">
            <View className="flex flex-row bg-white dark:bg-black">
              {days.map((day) => (
                <View key={day} style={{ width: DAY_WIDTH }}>
                  <View className="border-gray-75 border-b dark:border-gray-700" style={{ height: 30 }}>
                    <Text className="text-center">{dayjs(day).startOf("day").format("ddd Do")}</Text>
                  </View>
                  <TouchableOpacity
                    key={day}
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: "new", params: { date: day } })}
                    style={{ height }}
                    className={join(
                      `border-r border-gray-100 dark:border-gray-700`,
                      dayjs(day).isSame(dayjs(), "day")
                        ? "bg-primary-100 dark:bg-primary-900/90"
                        : dayjs(day).day() === 6 || dayjs(day).day() === 0
                          ? "bg-gray-50 dark:bg-gray-900"
                          : "bg-white dark:bg-gray-800",
                    )}
                  />
                </View>
              ))}
            </View>
            <View className="absolute" style={{ top: 30 }}>
              {isLoading ? null : !taskData ? null : <TasksGrid days={days} tasks={taskData} />}
            </View>
          </View>
        </ScrollView>
      </View>

      <View className="absolute bottom-4 left-0 right-0 space-y-4">
        <View className="flex flex-row items-end justify-between px-4">
          <View className="flex-1 flex-row">
            <TouchableOpacity
              onPress={() => scrollTo(timelineRef, 0, 0, true)}
              className="sq-14 flex items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-600 dark:bg-black"
            >
              <Icon icon={Calendar} size={24} color={isDark ? "white" : "black"} />
            </TouchableOpacity>
          </View>
          <View className="flex-1 flex-row justify-end">
            <Link href={`new?date=${dayjs(date).format("YYYY-MM-DD")}`} asChild>
              <TouchableOpacity className="bg-primary-500/90 sq-14 flex items-center justify-center rounded-full">
                <Icon icon={Plus} size={24} color="black" />
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        {/* <View className="border-gray-75 flex w-full flex-row items-center justify-between border-t px-8 pt-4">
          <View>
            <TouchableOpacity
              onPress={() => setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"))}
              className="sq-10 flex items-center justify-center rounded-full border border-gray-100 dark:border-gray-500"
            >
              <Ionicons name="chevron-back" color={isDark ? "white" : "black"} />
            </TouchableOpacity>
          </View>
          <Text className="flex-1 text-center text-lg">{dateLabel}</Text>
          <View>
            <TouchableOpacity
              onPress={() => setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"))}
              className="sq-10 flex items-center justify-center rounded-full border border-gray-100 dark:border-gray-500"
            >
              <Ionicons name="chevron-forward" color={isDark ? "white" : "black"} />
            </TouchableOpacity>
          </View>
        </View> */}
      </View>
    </View>
  )
}

type Tasks = NonNullable<RouterOutputs["task"]["byDate"]>

type Task = Tasks[number]

type DropTask = Pick<Task, "id" | "name" | "order"> & { date: string }

const DAY_WIDTH = 90

export const getDays = (startDate: Dayjs, daysCount: number) => {
  return Array.from({ length: daysCount }).map((_, i) => startDate.add(i, "day").format("YYYY-MM-DD"))
}
function TasksGrid({ tasks, days }: { tasks: Tasks; days: string[] }) {
  const taskPositions = useSharedValue(
    tasks.reduce<{ [key: string]: DropTask }>((acc, task) => {
      acc[task.id] = { id: task.id, name: task.name, date: task.date, order: task.order }
      return acc
    }, {}),
  )

  const { mutate } = api.task.updateOrder.useMutation()

  const handleDrop = (taskId: string) => {
    const newTask = taskPositions.value[taskId]!
    const oldTask = tasks.find((t) => t.id === taskId)!
    const oldDate = oldTask.date
    const newDate = newTask.date
    const tasksToUpdate = tasks.filter((t) => t.date === oldDate || t.date === newDate)
    mutate(
      tasksToUpdate.map((t) => ({ id: t.id, order: taskPositions.value[t.id]!.order, date: taskPositions.value[t.id]!.date })),
    )
  }

  // React.useEffect(() => {
  //   taskPositions.value = tasks.reduce<{ [key: string]: { id: string; date: string; order: number } }>((acc, task) => {
  //     acc[task.id] = { id: task.id, date: dayjs(task.date).format("YYYY-MM-DD"), order: task.order }
  //     return acc
  //   }, {})
  // }, [tasks])

  return (
    <>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} taskPositions={taskPositions} days={days} onDrop={() => handleDrop(task.id)} />
      ))}
    </>
  )
}

const TASK_HEIGHT = 80

function TaskItem({
  taskPositions,
  task,
  days,
  onDrop,
}: {
  days: string[]
  task: Omit<Tasks[number], "date"> & { date: string }
  taskPositions: SharedValue<{ [key: string]: DropTask }>
  onDrop: () => void
}) {
  const position = useDerivedValue(() => {
    const column = days.findIndex((day) => day === task.date)
    const order = taskPositions.value[task.id]!.order
    return { x: column * DAY_WIDTH, y: Math.floor(order) * TASK_HEIGHT }
  })

  const translateX = useSharedValue(position.value.x)
  const translateY = useSharedValue(position.value.y)
  const offsetX = useSharedValue(position.value.x)
  const offsetY = useSharedValue(position.value.y)
  const scale = useSharedValue(1)
  const isActive = useSharedValue(false)

  useAnimatedReaction(
    () => taskPositions.value[task.id]!,
    (newPosition) => {
      const column = days.findIndex((day) => day === newPosition.date)
      const x = column * DAY_WIDTH
      const y = Math.floor(newPosition.order) * TASK_HEIGHT
      translateX.value = withTiming(x)
      translateY.value = withTiming(y)
    },
  )

  const pan = Gesture.Pan()
    .onStart(() => {
      scale.value = withTiming(1.1)
      runOnJS(Haptics.selectionAsync)()
      isActive.value = true
    })
    .onUpdate((event) => {
      translateX.value = offsetX.value + event.translationX
      translateY.value = offsetY.value + event.translationY

      const newDate = days[Math.floor((translateX.value + DAY_WIDTH * 0.5) / DAY_WIDTH)]!

      const newOrder = Math.floor((translateY.value + TASK_HEIGHT * 0.5) / TASK_HEIGHT)

      const currentTask = taskPositions.value[task.id]!
      const newPositions = { ...taskPositions.value }
      if (newDate === currentTask.date) {
        const taskToSwap = Object.values(taskPositions.value).find((t) => t.date === newDate && t.order === newOrder)
        if (!taskToSwap || taskToSwap.id === currentTask.id) return
        newPositions[currentTask.id]! = {
          ...currentTask,
          order: newOrder,
        }
        newPositions[taskToSwap.id]! = {
          ...taskToSwap,
          order: currentTask.order,
        }
      } else {
        const tasksForNewDate = Object.values(taskPositions.value).filter((t) => t.date === newDate)
        const tasksForOldDate = Object.values(taskPositions.value).filter((t) => t.date === currentTask.date)
        // reorder tasks for new date
        const maxNewOrder = Math.min(tasksForNewDate.length, newOrder)
        const newTasksForNewDate = [
          ...tasksForNewDate.slice(0, maxNewOrder),
          { ...currentTask, date: newDate },
          ...tasksForNewDate.slice(maxNewOrder, tasksForNewDate.length),
        ]
        newTasksForNewDate.forEach((t, i) => {
          newPositions[t.id] = { ...t, order: i }
        })
        // reorder tasks for old date
        tasksForOldDate
          .filter((t) => t.id !== currentTask.id)
          .forEach((t, i) => {
            newPositions[t.id] = { ...t, order: i }
          })
      }
      taskPositions.value = newPositions
    })
    .onEnd(() => {
      // move dragging task into position
      const currentTask = taskPositions.value[task.id]!
      const newDate = days.findIndex((day) => day === currentTask.date)
      const newOrder = taskPositions.value[task.id]!.order
      translateX.value = withTiming(newDate * DAY_WIDTH)
      translateY.value = withTiming(Math.floor(newOrder) * TASK_HEIGHT)
      offsetX.value = withTiming(newDate * DAY_WIDTH)
      offsetY.value = withTiming(Math.floor(newOrder) * TASK_HEIGHT)
    })
    .onFinalize(() => {
      scale.value = withTiming(1)
      isActive.value = false
      runOnJS(onDrop)()
    })

  const handleNavigate = () => router.push({ pathname: "index", params: { id: task.id } })

  const animatedStyles = useAnimatedStyle(() => {
    return {
      position: "absolute",
      zIndex: isActive.value ? 1000 : 0,
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
    }
  })

  // const actionHeight = useSharedValue(0)
  const tap = Gesture.Tap().runOnJS(true).onStart(handleNavigate)

  const forceTouch = Gesture.ForceTouch().onStart(() => {
    // actionHeight.value = withTiming(50)
  })

  const gesture = Gesture.Race(pan, tap, forceTouch)

  return (
    <Animated.View style={[{ width: DAY_WIDTH, height: TASK_HEIGHT, padding: 4 }, animatedStyles]}>
      <GestureDetector gesture={gesture}>
        <Animated.View className="flex h-full flex-col justify-between rounded border border-gray-100 bg-white dark:border-gray-900 dark:bg-gray-700">
          <View className="p-1.5">
            <Text numberOfLines={2} className="text-xs">
              {task.name}
            </Text>
          </View>
          <Animated.View className="flex justify-center rounded-b" style={{ backgroundColor: task.element.color, height: 14 }}>
            <Animated.Text
              style={{ fontSize: 10, opacity: 1, color: safeReadableColor(task.element.color) }}
              numberOfLines={1}
              className="px-1"
            >
              {task.element.name}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

const _Habits = React.memo(function _Habits({ date }: { date: string }) {
  const { data } = api.habit.progressCompleteByDate.useQuery({ date })
  const progress = (data || 0) / 100
  const router = useRouter()
  const colorScheme = useColorScheme()

  const unfilledColor = {
    light: colors.red[500],
    dark: colors.red[700],
  }[colorScheme || "light"]

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: "habits", params: { date } })}
      activeOpacity={0.8}
      className="sq-14 flex items-center justify-center rounded-full border border-gray-100 dark:border-gray-600"
    >
      <Progress.Circle
        thickness={5}
        size={32}
        animated={false}
        borderWidth={0}
        progress={progress}
        unfilledColor={unfilledColor}
        color={colorScheme === "dark" ? colors.green[600] : colors.green[500]}
      />
    </TouchableOpacity>
  )
})
