import * as React from "react"
import dayjs from "dayjs"

import advancedFormat from "dayjs/plugin/advancedFormat"
import * as Progress from "react-native-progress"
import { Link, router, useRouter } from "expo-router"
import { View, TouchableOpacity, useColorScheme, ActivityIndicator } from "react-native"
import { api, RouterOutputs } from "../../../lib/utils/api"
import * as Haptics from "expo-haptics"

import { safeReadableColor, join } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { Text } from "../../../components/Text"
import { Heading } from "../../../components/Heading"

import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { Icon } from "../../../components/Icon"
import { Calendar, Plus } from "lucide-react-native"
import { height } from "../../../lib/utils/device"

dayjs.extend(advancedFormat)

export const getMonths = (startDate: string, daysCount: number) => {
  // Include year to cater for scrolling further than 12
  const monthsByDay = Array.from({ length: daysCount }).map(
    (_, i) => dayjs(startDate).add(i, "day").month() + "/" + dayjs(startDate).add(i, "day").year(),
  )
  const uniqueMonths = monthsByDay.filter((value, index, array) => array.indexOf(value) === index)
  return uniqueMonths.map((month) => ({
    month: Number(month.split("/", 2)[0]),
    year: Number(month.split("/", 2)[1]),
  }))
}

export const getDays = (startDate: string, daysCount: number) => {
  return Array.from({ length: daysCount }).map((_, i) => dayjs(startDate).add(i, "day").format("YYYY-MM-DD"))
}
const MONTH_NAMES = ["jan.", "feb.", "mar.", "apr.", "may.", "jun.", "jul.", "aug.", "sept.", "oct.", "nov.", "dec."]

export default function Timeline() {
  const [isLoaded, setIsLoaded] = React.useState(false)
  // const [date] = React.useState(dayjs().format("YYYY-MM-DD"))

  // const utils = api.useUtils()

  // React.useEffect(() => {
  //   // prefetch next and previous dates
  //   utils.task.byDate.prefetch({ date: dayjs(date).subtract(1, "day").format("YYYY-MM-DD") })
  //   utils.task.byDate.prefetch({ date: dayjs(date).add(1, "day").format("YYYY-MM-DD") })
  //   utils.habit.progressCompleteByDate.prefetch({ date: dayjs(date).subtract(1, "day").format("YYYY-MM-DD") })
  // }, [date])

  // const { features } = useFeatures()

  const timelineRef = useAnimatedRef<Animated.ScrollView>()
  const outerTimelineRef = useAnimatedRef<Animated.ScrollView>()
  const headerTranslateX = useSharedValue(0)

  const days = React.useMemo(() => getDays(dayjs().subtract(7, "days").format("YYYY-MM-DD"), 30), [])
  const months = React.useMemo(() => getMonths(dayjs().subtract(7, "days").format("YYYY-MM-DD"), 30), [])

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      headerTranslateX.value = -event.contentOffset.x
    },
  })

  const { isLoading } = api.task.byDate.useQuery(undefined, { staleTime: Infinity })

  const isDark = useColorScheme() === "dark"
  return (
    <View className="flex-1 pt-[70px]">
      <Animated.View className="flex flex-row" style={{ transform: [{ translateX: headerTranslateX }] }}>
        {months.map(({ month, year }) => (
          <View key={`${month}-${year}`}>
            <Animated.View>
              <Heading className="px-4 text-4xl">{MONTH_NAMES[month]}</Heading>
            </Animated.View>
            <View className="flex flex-row">
              {days
                .filter((day) => month === dayjs(day).month() && year === dayjs(day).year())
                .map((day) => (
                  <View key={day} style={{ width: DAY_WIDTH }} className="border-gray-75 border-b px-1 pb-2 dark:border-gray-700">
                    <Text className="text-center">{dayjs(day).startOf("day").format("ddd Do")}</Text>
                  </View>
                ))}
            </View>
          </View>
        ))}
      </Animated.View>

      <Animated.ScrollView ref={outerTimelineRef}>
        <Animated.ScrollView
          onLayout={() => {
            setTimeout(() => {
              timelineRef.current?.scrollTo({ x: DAY_WIDTH * 7, animated: false })
              setIsLoaded(true)
            }, 100)
          }}
          // contentOffset={{ x: 7 * DAY_WIDTH, y: 0 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ref={timelineRef}
          horizontal
        >
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: "new", params: { date: day } })}
              style={{ height: 1000, width: DAY_WIDTH }}
              className={join(
                `border-r border-gray-100 dark:border-gray-700`,
                dayjs(day).isSame(dayjs(), "day")
                  ? "bg-primary-100 dark:bg-primary-900/90"
                  : dayjs(day).day() === 6 || dayjs(day).day() === 0
                    ? "bg-gray-50 dark:bg-gray-900"
                    : "bg-white dark:bg-gray-800",
              )}
            />
          ))}
          {!isLoading && <TasksGrid days={days} />}
        </Animated.ScrollView>
      </Animated.ScrollView>

      <View className="absolute bottom-4 left-0 right-0 space-y-4">
        <View className="flex flex-row items-end justify-between px-4">
          <View className="flex-1 flex-row">
            <TouchableOpacity
              onPress={() => {
                timelineRef.current?.scrollTo({ x: 7 * DAY_WIDTH, animated: true })
                outerTimelineRef.current?.scrollTo({ y: 0, animated: true })
              }}
              className="sq-14 flex items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-600 dark:bg-black"
            >
              <Icon icon={Calendar} size={24} color={isDark ? "white" : "black"} />
            </TouchableOpacity>
          </View>
          <View className="flex-1 flex-row justify-end">
            <Link href={`new?date=${dayjs().format("YYYY-MM-DD")}`} asChild>
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
      {(!isLoaded || isLoading) && (
        <View
          style={{ height }}
          className="absolute left-0 right-0 top-0 flex items-center justify-center bg-white dark:bg-black"
        >
          <ActivityIndicator />
        </View>
      )}
    </View>
  )
}

type Tasks = NonNullable<RouterOutputs["task"]["byDate"]>

type Task = Tasks[number]

type DropTask = Pick<Task, "id" | "name" | "order"> & { date: string }

const DAY_WIDTH = 90

function TasksGrid({ days }: { days: string[] }) {
  const { data } = api.task.byDate.useQuery()
  const tasks = data || []

  const taskPositions = useSharedValue<{ [key: string]: DropTask }>(
    tasks.reduce<{ [key: string]: DropTask }>((acc, task) => {
      acc[task.id] = { id: task.id, name: task.name, date: task.date, order: task.order }
      return acc
    }, {}),
  )
  React.useEffect(() => {
    taskPositions.value = tasks.reduce<{ [key: string]: DropTask }>((acc, task) => {
      acc[task.id] = { id: task.id, name: task.name, date: task.date, order: task.order }
      return acc
    }, {})
  }, [tasks])

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

  if (tasks.length === 0) return null
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
    const taskPosition = taskPositions.value[task.id]
    const column = days.findIndex((day) => day === task.date)
    const order = taskPosition!.order || 0
    return { x: column * DAY_WIDTH, y: order * TASK_HEIGHT }
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
    .activateAfterLongPress(200)
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

  const tap = Gesture.Tap().runOnJS(true).onStart(handleNavigate)

  // const actionHeight = useSharedValue(0)
  // const forceTouch = Gesture.ForceTouch().onStart(() => {
  //   // actionHeight.value = withTiming(50)
  // })

  const gesture = Gesture.Race(pan, tap)

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
