import * as React from "react"
import { ActivityIndicator, RefreshControl, TouchableOpacity, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import * as Haptics from "expo-haptics"
import { Link, router } from "expo-router"
import { Calendar, Clock, Plus } from "lucide-react-native"

import { join, safeReadableColor } from "@element/shared"

import { Heading } from "../../../components/Heading"
import { Icon } from "../../../components/Icon"
import { Text } from "../../../components/Text"
import { api, type RouterOutputs } from "../../../lib/utils/api"
import { height, isAndroid } from "../../../lib/utils/device"
import { useTimelineDays } from "../../../lib/hooks/useTimelineDays"

dayjs.extend(advancedFormat)

export const getMonths = (startDate: string, daysBack: number, daysForward: number) => {
  // Include year to cater for scrolling further than 12
  const monthsByDay = Array.from({ length: daysBack + daysForward }).map(
    (_, i) => dayjs(startDate).add(i, "day").month() + "/" + dayjs(startDate).add(i, "day").year(),
  )
  const uniqueMonths = monthsByDay.filter((value, index, array) => array.indexOf(value) === index)
  return uniqueMonths.map((month) => ({
    month: Number(month.split("/", 2)[0]),
    year: Number(month.split("/", 2)[1]),
  }))
}

export const getDays = (startDate: string, daysBack: number, daysForward: number) => {
  return Array.from({ length: daysBack + daysForward }).map((_, i) => dayjs(startDate).add(i, "day").format("YYYY-MM-DD"))
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

  // used for manually scrolling the timeline
  // const timelineScrollX = useSharedValue(7 * DAY_WIDTH)
  // useAnimatedReaction(
  //   () => timelineScrollX.value,
  //   (x) => {
  //     scrollTo(timelineRef, x, 0, true)
  //   },
  // )

  const { daysBack, daysForward } = useTimelineDays()

  const days = React.useMemo(
    () => getDays(dayjs().subtract(daysBack, "days").format("YYYY-MM-DD"), daysBack, daysForward),
    [daysBack, daysForward],
  )
  const months = React.useMemo(
    () =>
      getMonths(dayjs().subtract(daysBack, "days").format("YYYY-MM-DD"), daysBack, daysForward).map(({ month, year }, index) => {
        let dayCount
        if (index === 0) {
          const startDate = dayjs().subtract(daysBack, "days")
          dayCount = startDate.endOf("month").diff(startDate, "days") + 1
        } else {
          dayCount = dayjs().month(month).year(year).daysInMonth()
        }

        return {
          month,
          year,
          width: dayCount * DAY_WIDTH,
        }
      }),
    [daysBack, daysForward],
  )

  const onScroll = useAnimatedScrollHandler((e) => {
    headerTranslateX.value = -e.contentOffset.x
    // TODO: scroll when reached start or end of scroll view

    // // if reached end of scroll view, fetch next month
    // console.log(e.contentOffset.x, e.contentSize.width)
    // if (e.contentOffset.x > e.contentSize.width - width - DAY_WIDTH * 2) {
    //   // setDaysForward((d) => d + initialDaysForward)
    // }
  })

  const { isLoading, refetch } = api.task.timeline.useQuery({ daysBack, daysForward }, { staleTime: Infinity })

  // const maxTaskCountPerDay = React.useMemo(() => {
  //   if (!data) return 0
  //   const taskCountPerDay = days.map((day) => data?.filter((task) => task.date === day).length || 0)
  //   return Math.max(...taskCountPerDay)
  // }, [data, days])

  return (
    <View className="flex-1 pt-16">
      <Animated.View className="flex flex-row" style={{ transform: [{ translateX: headerTranslateX }] }}>
        {months.map(({ month, year, width }, i) => {
          // left start is the sum of all previous months
          const leftStart = months.slice(0, i).reduce((acc, { width }) => acc + width, 0)
          return (
            <View key={`${month}-${year}-${i}`} style={{ width }}>
              <Month month={month} width={width} leftStart={leftStart} headerTranslateX={headerTranslateX} />
            </View>
          )
        })}
      </Animated.View>
      <Animated.View className="flex flex-row" style={{ transform: [{ translateX: headerTranslateX }] }}>
        {days.map((day) => (
          <View key={day} style={{ width: DAY_WIDTH }} className="border-gray-75 border-b px-1 pb-2 dark:border-gray-700">
            <Text className="text-center">{dayjs(day).startOf("day").format("ddd Do")}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.ScrollView ref={outerTimelineRef} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        <Animated.ScrollView
          onLayout={() => {
            setTimeout(() => {
              timelineRef.current?.scrollTo({ x: DAY_WIDTH * daysBack, animated: false })
              setIsLoaded(true)
            }, 1000)
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
              style={{ height, width: DAY_WIDTH }}
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
          {/* <TouchableOpacity
            onPress={() => {
              setDaysBack((d) => d + initialDaysBack)
            }}
            className="absolute left-4 top-20 rounded-full border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-black"
          >
            <Icon icon={ChevronLeft} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDaysForward((d) => d + initialDaysForward)}
            className="absolute right-4 top-20 rounded-full border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-black"
          >
            <Icon icon={ChevronRight} size={24} />
          </TouchableOpacity> */}
        </Animated.ScrollView>
      </Animated.ScrollView>

      <View className="absolute bottom-4 left-4 space-y-2">
        <Link href={`backlog`} asChild>
          <TouchableOpacity className="sq-14 flex items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-600 dark:bg-black">
            <Icon icon={Clock} size={24} />
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          onPress={() => {
            timelineRef.current?.scrollTo({ x: daysBack * DAY_WIDTH, animated: true })
            outerTimelineRef.current?.scrollTo({ y: 0, animated: true })
          }}
          className="sq-14 flex items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-600 dark:bg-black"
        >
          <Icon icon={Calendar} size={24} />
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-4 right-4">
        <Link href={`new?date=${dayjs().format("YYYY-MM-DD")}`} asChild>
          <TouchableOpacity className="bg-primary-500/90 sq-14 flex items-center justify-center rounded-full">
            <Icon icon={Plus} size={24} color="black" />
          </TouchableOpacity>
        </Link>
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

function Month({
  month,
  width,
  leftStart,
  headerTranslateX,
}: {
  month: number
  width: number
  leftStart: number
  headerTranslateX: SharedValue<number>
}) {
  const style = useAnimatedStyle(() => {
    let translateX = 0
    if (-headerTranslateX.value > leftStart && -headerTranslateX.value < leftStart + width - DAY_WIDTH) {
      // if month header is in view but not about to leave, stick to left
      translateX = -headerTranslateX.value - leftStart
    } else if (-headerTranslateX.value > leftStart + width - DAY_WIDTH - 1) {
      // if month header is in view, but is going off screen, stick to right (-1 to account for decimal in scroll view)
      translateX = width - DAY_WIDTH
    } else {
      translateX = 0
    }
    return { transform: [{ translateX }] }
  })

  return (
    <Animated.View style={[{ width: DAY_WIDTH }, style]}>
      <Heading className="text-center text-3xl">{MONTH_NAMES[month]}</Heading>
    </Animated.View>
  )
}

type Tasks = NonNullable<RouterOutputs["task"]["timeline"]>

type Task = Tasks[number]

type DropTask = Pick<Task, "id" | "name" | "order"> & { date: string }

const DAY_WIDTH = 90

function TasksGrid({ days }: { days: string[] }) {
  const { daysBack, daysForward } = useTimelineDays()
  const { data, refetch } = api.task.timeline.useQuery({ daysBack, daysForward }, { staleTime: Infinity })
  // eslint-disable-next-line
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
  }, [tasks, taskPositions])

  const { mutate } = api.task.updateOrder.useMutation({ onSuccess: () => refetch() })

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
    const order = taskPosition?.order || 0
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
      const y = newPosition.order * TASK_HEIGHT
      translateX.value = withTiming(x)
      translateY.value = withTiming(y)
    },
  )

  const pan = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      offsetX.value = translateX.value
      offsetY.value = translateY.value
      scale.value = withTiming(1.1)
      if (!isAndroid) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium)
      }
      isActive.value = true
    })
    .onUpdate((event) => {
      // TODO: figure out scrolling
      // const positionX = event.absoluteX + timelineScrollX.value
      // if (positionX < timelineScrollX.value + DAY_WIDTH / 2) {
      //   // scroll left
      //   timelineScrollX.value = Math.max(timelineScrollX.value - DAY_WIDTH / 2, 0)
      //   translateX.value = Math.max(offsetX.value + event.translationX - DAY_WIDTH / 2, 0)
      // } else if (positionX >= timelineScrollX.value + width - DAY_WIDTH / 2) {
      //   // scroll right
      //   timelineScrollX.value = withTiming(timelineScrollX.value + DAY_WIDTH / 2)
      //   translateX.value = withTiming(offsetX.value + event.translationX + DAY_WIDTH / 2)
      // } else {
      //   // regular move
      //   // cancelAnimation(timelineScrollX)
      // }
      translateX.value = offsetX.value + event.translationX
      translateY.value = Math.max(offsetY.value + event.translationY, 0)

      const newDate = days[Math.floor((translateX.value + DAY_WIDTH * 0.5) / DAY_WIDTH)]!
      const newOrder = Math.floor((translateY.value + TASK_HEIGHT * 0.5) / TASK_HEIGHT)

      const currentTask = taskPositions.value[task.id]!
      const newPositions = { ...taskPositions.value }
      if (newDate === currentTask.date) {
        // reorder current date tasks
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
        // reorder tasks for new date
        const tasksForNewDate = Object.values(taskPositions.value).filter((t) => t.date === newDate)
        const tasksForOldDate = Object.values(taskPositions.value).filter((t) => t.date === currentTask.date)
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
      translateY.value = withTiming(newOrder * TASK_HEIGHT)
    })
    .onFinalize(() => {
      scale.value = withTiming(1, undefined, () => {
        isActive.value = false
      })
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
