import { formatDuration, join, safeReadableColor } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import { BlurView } from "expo-blur"
import * as Haptics from "expo-haptics"
import { Link, router } from "expo-router"
import { AlarmClock, Book, Calendar, Clock, MoreVertical, Plus, X } from "lucide-react-native"
import * as React from "react"
import { ActivityIndicator, RefreshControl, TouchableOpacity, View, useColorScheme } from "react-native"
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
  scrollTo,
  ReanimatedLogLevel,
  configureReanimatedLogger,
  withTiming,
  useScrollViewOffset,
} from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"
import { Heading } from "~/components/Heading"
import { Icon } from "~/components/Icon"
import { Text } from "~/components/Text"
import { useMe } from "~/lib/hooks/useMe"
import { useOnboarding } from "~/lib/hooks/useOnboarding"
import { useTemporaryData } from "~/lib/hooks/useTemporaryTasks"
import { DAY_WIDTH, days, daysBack, daysForward, months } from "~/lib/hooks/useTimeline"
import { type RouterOutputs, api } from "~/lib/utils/api"
import { height, width } from "~/lib/utils/device"

configureReanimatedLogger({ level: ReanimatedLogLevel.error })

dayjs.extend(advancedFormat)

const MONTH_NAMES = ["jan.", "feb.", "mar.", "apr.", "may.", "jun.", "jul.", "aug.", "sept.", "oct.", "nov.", "dec."]

export default function Timeline() {
  const { hasSeenOnboarding } = useOnboarding()
  const { me } = useMe()

  React.useEffect(() => {
    if (!me) return
    const timeout = setTimeout(() => {
      if (!hasSeenOnboarding) {
        router.push("/onboarding/")
      }
    }, 1000)
    return () => clearTimeout(timeout)
  }, [hasSeenOnboarding, me])

  const [isLoaded, setIsLoaded] = React.useState(false)

  const timelineRef = useAnimatedRef<Animated.ScrollView>()
  const outerTimelineRef = useAnimatedRef<Animated.ScrollView>()
  const headerTranslateX = useSharedValue(0)

  const timelineScrollX = useScrollViewOffset(timelineRef)

  const timelineScrollY = useScrollViewOffset(outerTimelineRef)

  const onScroll = useAnimatedScrollHandler((e) => {
    headerTranslateX.value = -e.contentOffset.x
    // timelineScrollX.value = -e.contentOffset.x
    // TODO: scroll when reached start or end of scroll view
    // // if reached end of scroll view, fetch next month
    // console.log(e.contentOffset.x, e.contentSize.width)
    // if (e.contentOffset.x > e.contentSize.width - width - DAY_WIDTH * 2) {
    //   // setDaysForward((d) => d + initialDaysForward)
    // }
  })

  // TODO dynamic day height?
  // const maxTaskCountPerDay = React.useMemo(() => {
  //   if (!data) return 0
  //   const taskCountPerDay = days.map((day) => data?.filter((task) => task.date === day).length || 0)
  //   return Math.max(...taskCountPerDay)
  // }, [data, days])

  const utils = api.useUtils()

  useAnimatedReaction(
    () => timelineScrollX.value,
    (x) => {
      headerTranslateX.value = -x
      scrollTo(timelineRef, x, 0, false)
    },
  )

  useAnimatedReaction(
    () => timelineScrollY.value,
    (y) => {
      scrollTo(outerTimelineRef, 0, y, false)
    },
  )

  return (
    <SafeAreaView edges={["top"]} className="flex-1 pt-2 relative">
      <Animated.View className="flex flex-row" style={{ transform: [{ translateX: headerTranslateX }] }}>
        <TimelineMonths headerTranslateX={headerTranslateX} />
      </Animated.View>
      <Animated.View className="flex flex-row" style={{ transform: [{ translateX: headerTranslateX }] }}>
        <TimelineDays />
      </Animated.View>

      <Animated.ScrollView
        ref={outerTimelineRef}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => utils.task.timeline.refetch({ daysBack, daysForward })} />
        }
      >
        <Animated.ScrollView
          onLayout={() => {
            timelineRef.current?.scrollTo({ x: DAY_WIDTH * daysBack, animated: false })
            setTimeout(() => {
              setIsLoaded(true)
            }, 300)
          }}
          // contentOffset={{ x: 7 * DAY_WIDTH, y: 0 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ref={timelineRef}
          horizontal
        >
          <TimelineDayColumns />
          <TasksGridWrapper timelineScrollX={timelineScrollX} timelineScrollY={timelineScrollY} />
        </Animated.ScrollView>
      </Animated.ScrollView>

      <TimelineActions
        onScrollToToday={() => {
          timelineRef.current?.scrollTo({ x: daysBack * DAY_WIDTH, animated: true })
          outerTimelineRef.current?.scrollTo({ y: 0, animated: true })
        }}
      />
      {!isLoaded && (
        <View
          style={{ height }}
          className="absolute left-0 right-0 top-0 flex items-center justify-center bg-white dark:bg-black"
        >
          <ActivityIndicator />
        </View>
      )}
    </SafeAreaView>
  )
}

const TimelineMonths = React.memo(function _TimelineMonths({ headerTranslateX }: { headerTranslateX: SharedValue<number> }) {
  return (
    <>
      {months.map(({ month, year, width }, i) => {
        // left start is the sum of all previous months' widths
        const leftStart = months.slice(0, i).reduce((acc, { width }) => acc + width, 0)
        return (
          <View key={`${month}-${year}`} style={{ width }}>
            <Month month={month} width={width} leftStart={leftStart} headerTranslateX={headerTranslateX} />
          </View>
        )
      })}
    </>
  )
})

const TimelineDays = React.memo(function _TimelineDays() {
  return (
    <>
      {days.map((day) => (
        <View key={day} style={{ width: DAY_WIDTH }} className="border-gray-75 border-b px-1 pb-2 dark:border-gray-700">
          <Text className="text-center">{dayjs(day).startOf("day").format("ddd Do")}</Text>
        </View>
      ))}
    </>
  )
})

const TimelineDayColumns = React.memo(function _TimelineDayColumns() {
  return (
    <>
      {days.map((day) => (
        <TouchableOpacity
          key={day}
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: "/new", params: { date: day } })}
          style={{ height: 1200, width: DAY_WIDTH, zIndex: 1 }}
          className={join(
            "border-r border-gray-100 dark:border-gray-700",
            dayjs(day).isSame(dayjs(), "date")
              ? "bg-primary-100 dark:bg-primary-900/90"
              : dayjs(day).day() === 6 || dayjs(day).day() === 0
                ? "bg-gray-50 dark:bg-gray-900"
                : "bg-white dark:bg-gray-800",
          )}
        />
      ))}
    </>
  )
})

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
      transform: [{ rotate: `${menuButtonRotate.value}deg` }],
    }
  })

  return (
    <View pointerEvents="box-none" className="absolute flex bottom-4 right-4 gap-1">
      {me && (
        <View pointerEvents="box-none" className="gap-1">
          <Animated.View style={{ opacity: backlogOpacity, transform: [{ translateY: backlogTranslateY }] }}>
            <Link href={"/backlog"} asChild>
              <TouchableOpacity className="sq-14 flex items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-600 dark:bg-black">
                <Icon icon={Clock} size={24} />
              </TouchableOpacity>
            </Link>
          </Animated.View>

          <Animated.View style={{ opacity: elementsOpacity, transform: [{ translateY: elementsTranslateY }] }}>
            <Link href="/elements" asChild>
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

      <Link href={{ pathname: "/new", params: { date: dayjs().format("YYYY-MM-DD") } }} asChild>
        <TouchableOpacity className="bg-primary-500/90 sq-14 flex items-center justify-center rounded-full">
          <Icon icon={Plus} size={24} color="black" />
        </TouchableOpacity>
      </Link>
    </View>
  )
}

const Month = React.memo(function _Month({
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
})

const TasksGridWrapper = React.memo(function _TasksGridWrapper({
  timelineScrollX,
  timelineScrollY,
}: { timelineScrollX: SharedValue<number>; timelineScrollY: SharedValue<number> }) {
  const { me, isLoading: userLoading } = useMe()

  const { data, isLoading } = api.task.timeline.useQuery({ daysBack, daysForward }, { enabled: !!me })

  const { tasks: tempTasks } = useTemporaryData()

  if (userLoading) return null
  if (me && (isLoading || !data)) return null
  const tasks = me ? data! : tempTasks
  return <TasksGrid tasks={tasks} timelineScrollX={timelineScrollX} timelineScrollY={timelineScrollY} />
})

type Tasks = NonNullable<RouterOutputs["task"]["timeline"]>

type Task = Tasks[number]

type DropTask = Pick<Task, "id" | "isComplete" | "order" | "date">

const TasksGrid = React.memo(function _TasksGrid({
  tasks,
  timelineScrollX,
  timelineScrollY,
}: { tasks: Task[]; timelineScrollX: SharedValue<number>; timelineScrollY: SharedValue<number> }) {
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: allow
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
        <TaskItem
          key={task.id}
          task={task}
          taskPositions={taskPositions}
          onDrop={() => handleDrop(task.id)}
          timelineScrollX={timelineScrollX}
          timelineScrollY={timelineScrollY}
        />
      ))}
    </>
  )
})

const TASK_HEIGHT = 80
const SCROLL_THRESHOLD = DAY_WIDTH * 0.4 // How close to edge before scrolling
const SCROLL_SPEED = DAY_WIDTH * 0.1 // How fast to scroll
const TOP_BAR_HEIGHT = 130
const BOTTOM_BAR_HEIGHT = 100

const TaskItem = React.memo(function _TaskItem({
  taskPositions,
  task,
  onDrop,
  timelineScrollX,
  timelineScrollY,
}: {
  task: Task
  taskPositions: SharedValue<{ [key: string]: DropTask }>
  onDrop: () => void
  timelineScrollX: SharedValue<number>
  timelineScrollY: SharedValue<number>
}) {
  const [isComplete, setIsComplete] = React.useState(task.isComplete)
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
      // Check if near left edge
      if (event.absoluteX < SCROLL_THRESHOLD) {
        // Scroll left
        timelineScrollX.value = Math.max(timelineScrollX.value - SCROLL_SPEED, 0)
        // Update task position relative to scroll
        offsetX.value -= SCROLL_SPEED
      } else if (event.absoluteX > width - SCROLL_THRESHOLD) {
        // Check if near right edge
        // Scroll right
        timelineScrollX.value = Math.min(timelineScrollX.value + SCROLL_SPEED, days.length * DAY_WIDTH - width)
        // Update task position relative to scroll
        offsetX.value += SCROLL_SPEED
      }

      console.log(event.absoluteY)

      if (event.absoluteY < TOP_BAR_HEIGHT + SCROLL_THRESHOLD) {
        // Scroll up
        timelineScrollY.value = Math.max(timelineScrollY.value - SCROLL_SPEED, 0)
        // Update task position relative to scroll
        offsetY.value -= SCROLL_SPEED
      } else if (event.absoluteY > height - BOTTOM_BAR_HEIGHT - SCROLL_THRESHOLD) {
        // Scroll down
        timelineScrollY.value = Math.min(
          timelineScrollY.value + SCROLL_SPEED,
          days.length * TASK_HEIGHT - height - BOTTOM_BAR_HEIGHT,
        )
        // Update task position relative to scroll
        offsetY.value += SCROLL_SPEED
      }
      translateX.value = Math.max(offsetX.value + event.translationX, 0)
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

  const handleNavigate = () => router.push({ pathname: "/(home)/(timeline)/[id]", params: { id: task.id } })

  const animatedStyles = useAnimatedStyle(() => {
    return {
      position: "absolute",
      zIndex: isActive.value ? 1000 : 10,
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
      const newIsComplete = !isComplete
      if (me) {
        mutate({ id: task.id, isComplete: newIsComplete })
      } else {
        updateTask({ isComplete: newIsComplete })
      }
      setIsComplete(newIsComplete)
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
    <Animated.View style={[{ width: DAY_WIDTH, height: TASK_HEIGHT, padding: 4, zIndex: 1000 }, animatedStyles]}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          className={join(
            "flex h-full flex-col justify-between overflow-hidden rounded border border-gray-100 bg-white dark:border-gray-900 dark:bg-gray-700",
            task.isImportant && !isComplete && "border-primary-400 dark:border-primary-400 border-2",
          )}
        >
          <View className="relative flex-1">
            <View className="flex-1 pt-1">
              <Text
                numberOfLines={2}
                className="px-1 text-xs"
                style={{ textDecorationLine: isComplete ? "line-through" : undefined }}
              >
                {task.name}
              </Text>
              {isComplete && <BlurView intensity={6} className="absolute h-full w-full" />}
            </View>
            {!isComplete && task.description && (
              <View
                style={{ backgroundColor: task.element.color }}
                className="sq-1.5 absolute right-1 top-1 rounded-full opacity-70"
              />
            )}
            {!isComplete && task.todos.length > 0 && (
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

            {!isComplete && (
              <View className="flex flex-row items-end justify-between px-1 pb-0.5">
                {task.durationHours || task.durationMinutes ? (
                  <Text className="text-xxs">{formatDuration(task.durationHours, task.durationMinutes)}</Text>
                ) : (
                  <View />
                )}
                {task.startTime ? (
                  <View className="flex flex-row items-center gap-0.5">
                    {task.reminder && <Icon icon={AlarmClock} size={10} />}

                    <Text className="text-xxs">{task.startTime}</Text>
                  </View>
                ) : (
                  <View />
                )}
              </View>
            )}
          </View>

          <View
            className="flex justify-center"
            style={{
              backgroundColor: task.element.color,
              opacity: isComplete ? 0.4 : 1,
              height: isComplete ? 6 : 14,
            }}
          >
            {!isComplete && (
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
})
