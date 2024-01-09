import * as React from "react"
import { ActivityIndicator, RefreshControl, TouchableOpacity, useColorScheme, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import * as Progress from "react-native-progress"
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
import { BlurView } from "expo-blur"
import * as Haptics from "expo-haptics"
import { Link, router } from "expo-router"
import { Book, Calendar, Clock, MoreVertical, Plus, X } from "lucide-react-native"

import { formatDuration, join, safeReadableColor } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { Heading } from "../../../components/Heading"
import { Icon } from "../../../components/Icon"
import { Text } from "../../../components/Text"
import { useMe } from "../../../lib/hooks/useMe"
import { useOnboarding } from "../../../lib/hooks/useOnboarding"
import { useTemporaryData } from "../../../lib/hooks/useTemporaryTasks"
import { useTimelineDays } from "../../../lib/hooks/useTimelineDays"
import { api, type RouterOutputs } from "../../../lib/utils/api"
import { height } from "../../../lib/utils/device"

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
  const hasSeenOnboarding = useOnboarding((s) => s.hasSeenOnboarding)

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasSeenOnboarding) {
        router.push("/onboarding")
      }
    }, 1000)
    return () => clearTimeout(timeout)
  }, [hasSeenOnboarding])

  const [isLoaded, setIsLoaded] = React.useState(false)

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

  const { me } = useMe()
  const { data, isLoading, refetch } = api.task.timeline.useQuery(
    { daysBack, daysForward },
    { staleTime: Infinity, enabled: !!me },
  )

  const { tasks: tempTasks } = useTemporaryData()

  // TODO dynamic day height?
  // const maxTaskCountPerDay = React.useMemo(() => {
  //   if (!data) return 0
  //   const taskCountPerDay = days.map((day) => data?.filter((task) => task.date === day).length || 0)
  //   return Math.max(...taskCountPerDay)
  // }, [data, days])

  return (
    <View className="flex-1 pt-16">
      <Animated.View className="flex flex-row" style={{ transform: [{ translateX: headerTranslateX }] }}>
        {months.map(({ month, year, width }, i) => {
          // left start is the sum of all previous months' widths
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
            }, 500)
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
          {me ? !isLoading && data && <TasksGrid days={days} tasks={data} /> : <TasksGrid days={days} tasks={tempTasks} />}
        </Animated.ScrollView>
      </Animated.ScrollView>

      <TimelineActions
        onScrollToToday={() => {
          timelineRef.current?.scrollTo({ x: daysBack * DAY_WIDTH, animated: true })
          outerTimelineRef.current?.scrollTo({ y: 0, animated: true })
        }}
      />
      {(!isLoaded || (me && isLoading && !data)) && (
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

function TimelineActions({ onScrollToToday }: { onScrollToToday: () => void }) {
  const { me } = useMe()
  const menuButtonRotate = useSharedValue(0)
  const [isMenuActive, setIsMenuActive] = React.useState(false)
  const backlogTranslateY = useSharedValue(120)
  const elementsTranslateY = useSharedValue(60)
  const backlogOpacity = useSharedValue(0)
  const elementsOpacity = useSharedValue(0)

  const onToggleMenu = () => {
    if (isMenuActive) {
      setIsMenuActive(false)
      backlogTranslateY.value = withTiming(120, { duration: 100 })
      elementsTranslateY.value = withTiming(60, { duration: 100 })
      backlogOpacity.value = withTiming(0, { duration: 100 })
      elementsOpacity.value = withTiming(0, { duration: 100 })
      menuButtonRotate.value = withTiming(0, { duration: 100 })
    } else {
      setIsMenuActive(true)
      backlogTranslateY.value = withTiming(0, { duration: 100 })
      elementsTranslateY.value = withTiming(0, { duration: 100 })
      backlogOpacity.value = withTiming(1, { duration: 100 })
      elementsOpacity.value = withTiming(1, { duration: 100 })
      menuButtonRotate.value = withTiming(90, { duration: 200 })
    }
  }

  const menuButtonStyles = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: menuButtonRotate.value + "deg" }],
    }
  })

  return (
    <View pointerEvents="box-none" className="absolute bottom-4 right-4 space-y-1">
      {me && (
        <View pointerEvents="box-none" className="space-y-1">
          <Animated.View style={{ opacity: backlogOpacity, transform: [{ translateY: backlogTranslateY }] }}>
            <Link href={`backlog`} asChild>
              <TouchableOpacity className="sq-14 flex items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-600 dark:bg-black">
                <Icon icon={Clock} size={24} />
              </TouchableOpacity>
            </Link>
          </Animated.View>

          <Animated.View style={{ opacity: elementsOpacity, transform: [{ translateY: elementsTranslateY }] }}>
            <Link href={`elements`} asChild>
              <TouchableOpacity className="sq-14 flex items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-600 dark:bg-black">
                <Icon icon={Book} size={24} />
              </TouchableOpacity>
            </Link>
          </Animated.View>
          <Animated.View style={menuButtonStyles}>
            <TouchableOpacity
              onPress={onToggleMenu}
              className="sq-14 flex items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-600 dark:bg-black"
            >
              <Icon icon={isMenuActive ? X : MoreVertical} size={24} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
      <TouchableOpacity
        onPress={onScrollToToday}
        className="sq-14 flex items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-600 dark:bg-black"
      >
        <Icon icon={Calendar} size={24} />
      </TouchableOpacity>
      <Link href={`new?date=${dayjs().format("YYYY-MM-DD")}`} asChild>
        <TouchableOpacity className="bg-primary-500/90 sq-14 flex items-center justify-center rounded-full">
          <Icon icon={Plus} size={24} color="black" />
        </TouchableOpacity>
      </Link>
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

type DropTask = Pick<Task, "id" | "isComplete" | "order" | "date">

const DAY_WIDTH = 90

function TasksGrid({ days, tasks }: { days: string[]; tasks: Task[] }) {
  const taskPositions = useSharedValue(
    tasks.reduce<{ [key: string]: DropTask }>((acc, task) => {
      acc[task.id] = {
        id: task.id,
        isComplete: task.isComplete,
        order: task.order,
        date: task.date,
      }
      return acc
    }, {}),
  )
  React.useEffect(() => {
    taskPositions.value = tasks.reduce<{ [key: string]: DropTask }>((acc, task) => {
      acc[task.id] = {
        id: task.id,
        isComplete: task.isComplete,
        order: task.order,
        date: task.date,
      }
      return acc
    }, {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks])

  const { me } = useMe()
  const updateTempTaskOrder = useTemporaryData((s) => s.updateOrder)
  const utils = api.useUtils()
  const { mutate } = api.task.updateOrder.useMutation()
  const { daysBack, daysForward } = useTimelineDays()
  const handleDrop = (taskId: string) => {
    const newTask = taskPositions.value[taskId]!
    const oldTask = tasks.find((t) => t.id === taskId)!
    const oldDate = oldTask.date
    const newDate = newTask.date
    const tasksToUpdate = tasks.filter((t) => t.date === oldDate || t.date === newDate)

    if (me) {
      utils.task.timeline.setData({ daysBack, daysForward }, (old) => {
        if (!old) return old
        // update tasks in timeline using tasksToUpdate
        return old.map((t) => {
          const taskToUpdate = tasksToUpdate.find((tu) => tu.id === t.id)
          if (taskToUpdate) {
            return { ...t, order: taskPositions.value[t.id]!.order, date: taskPositions.value[t.id]!.date }
          }
          return t
        })
      })
      mutate(
        tasksToUpdate.map((t) => ({ id: t.id, order: taskPositions.value[t.id]!.order, date: taskPositions.value[t.id]!.date })),
      )
    } else {
      updateTempTaskOrder(
        tasksToUpdate.map((t) => ({
          ...t,
          order: taskPositions.value[t.id]!.order,
          date: dayjs(taskPositions.value[t.id]!.date).format("YYYY-MM-DD"),
        })),
      )
    }
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
  task: Task
  taskPositions: SharedValue<{ [key: string]: DropTask }>
  onDrop: () => void
}) {
  const isComplete = useSharedValue(task.isComplete)
  const position = useDerivedValue(() => {
    const taskPosition = taskPositions.value[task.id]
    const column = days.findIndex((day) => day === task.date)
    const dayTasksCount = Object.values(taskPositions.value).filter((t) => t.date === task.date).length
    const order = taskPosition ? taskPosition.order : dayTasksCount
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
    .activateAfterLongPress(100)
    .onStart(() => {
      offsetX.value = translateX.value
      offsetY.value = translateY.value
      scale.value = withTiming(1.1)
      isActive.value = true
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium)
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
        const taskToSwap = Object.values(newPositions).find((t) => t.date === newDate && t.order === newOrder)
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
        const tasksForNewDate = Object.values(newPositions)
          .filter((t) => t.date === newDate)
          .sort((a, b) => a.order - b.order)
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
        const tasksForOldDate = Object.values(newPositions)
          .filter((t) => t.date === currentTask.date)
          .sort((a, b) => a.order - b.order)
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
      runOnJS(onDrop)()
    })
    .onFinalize(() => {
      scale.value = withTiming(1, undefined, () => {
        isActive.value = false
      })
    })

  const handleNavigate = () => router.push({ pathname: "index", params: { id: task.id } })

  const animatedStyles = useAnimatedStyle(() => {
    return {
      position: "absolute",
      zIndex: isActive.value ? 1000 : 0,
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
    }
  })

  const { mutate } = api.task.update.useMutation()

  const isDark = useColorScheme() === "dark"
  const { me } = useMe()
  const { updateTask } = useTemporaryData()
  const longPress = Gesture.LongPress()
    .minDuration(1000)
    .runOnJS(true)
    .onStart(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      isComplete.value = !isComplete.value
      if (me) {
        mutate({ id: task.id, isComplete: !task.isComplete })
      } else {
        updateTask({ isComplete: !task.isComplete })
      }
    })

  const utils = api.useUtils()
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onTouchesDown(() => {
      void utils.task.byId.prefetch({ id: task.id })
    })
    .onStart(handleNavigate)

  const gesture = Gesture.Race(Gesture.Simultaneous(pan, longPress), tap)

  return (
    <Animated.View style={[{ width: DAY_WIDTH, height: TASK_HEIGHT, padding: 4 }, animatedStyles]}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          className={join(
            "flex h-full flex-col justify-between overflow-hidden rounded border border-gray-100 bg-white dark:border-gray-900 dark:bg-gray-700",
            task.isImportant && !isComplete.value && "border-primary-400 dark:border-primary-400 border-2",
          )}
        >
          <View className="relative flex-1">
            <View className="flex-1 pt-1">
              <Text
                numberOfLines={2}
                className="px-1 text-xs"
                style={{ textDecorationLine: isComplete.value ? "line-through" : undefined }}
              >
                {task.name}
              </Text>
              {isComplete.value && <BlurView intensity={isComplete.value ? 6 : 0} className="absolute h-full w-full" />}
            </View>
            {!isComplete.value && task.description && (
              <View
                style={{ backgroundColor: task.element.color }}
                className="sq-1.5 absolute right-1 top-1 rounded-full opacity-70"
              />
            )}
            {!isComplete.value && task.todos.length > 0 && (
              <View className={join("absolute right-[3px] top-1 opacity-70", task.description && "top-3.5")}>
                <Progress.Circle
                  thickness={2}
                  size={8}
                  animated={false}
                  borderWidth={0}
                  progress={task.todos.filter((t) => t.isComplete).length / task.todos.length}
                  unfilledColor={isDark ? colors.gray[900] : colors.gray[100]}
                  color={task.element.color}
                />
              </View>
            )}

            {!isComplete.value && (
              <View className="flex flex-row items-end justify-between px-1 pb-0.5">
                {task.durationHours || task.durationMinutes ? (
                  <Text className="text-xxs">{formatDuration(task.durationHours, task.durationMinutes)}</Text>
                ) : (
                  <View />
                )}
                {task.startTime ? <Text className="text-xxs">{task.startTime}</Text> : <View />}
              </View>
            )}
          </View>

          <View
            className="flex justify-center"
            style={{
              backgroundColor: task.element.color,
              opacity: isComplete.value ? 0.4 : 1,
              height: isComplete.value ? 6 : 14,
            }}
          >
            {!isComplete.value && (
              <Text
                style={{ fontSize: 10, opacity: 1, color: safeReadableColor(task.element.color) }}
                numberOfLines={1}
                className="px-1"
              >
                {task.element.name}
              </Text>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}
