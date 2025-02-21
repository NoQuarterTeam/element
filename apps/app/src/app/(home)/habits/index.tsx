import { useActionSheet } from "@expo/react-native-action-sheet"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import updateLocale from "dayjs/plugin/updateLocale"
import * as Haptics from "expo-haptics"
import { Link, useRouter } from "expo-router"
import { Calendar, Check, Circle, Clock, Plus, TrendingUp } from "lucide-react-native"
import * as React from "react"
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"
import { create } from "zustand"

import { join } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { Heading } from "~/components/Heading"
import { Icon } from "~/components/Icon"
import { Text } from "~/components/Text"
import { type RouterOutputs, api } from "~/lib/utils/api"
import { width } from "~/lib/utils/device"

dayjs.extend(advancedFormat)
dayjs.extend(updateLocale)

dayjs.updateLocale("en", {
  weekStart: 1,
})

type Habit = NonNullable<RouterOutputs["habit"]["allByDate"]>["habits"][number]

const WEEKS_BACK = 3
const todaysWeek = dayjs().startOf("week")
const weeks = Array.from({ length: WEEKS_BACK })
  .map((_, i) => todaysWeek.subtract(i, "week"))
  .reverse()

export const useActiveDate = create<{
  date: Date
  setDate: (date: Date) => void
}>()((set) => ({
  date: dayjs().startOf("day").add(12, "hours").toDate(),
  setDate: (date) => set({ date }),
}))

export default function Habits() {
  const setDate = useActiveDate((s) => s.setDate)
  const scrollViewRef = React.useRef<ScrollView>(null)

  const isMounted = React.useRef(false)
  React.useEffect(() => {
    if (!isMounted.current) {
      scrollViewRef.current?.scrollToEnd()
    }
    isMounted.current = true
  }, [])

  return (
    <SafeAreaView edges={["top"]} className="flex-1 pt-2 relative">
      <View className="flex flex-row items-center justify-between px-4 pb-2">
        <Heading className="text-3xl">Habits</Heading>
        <Link href="/habits/stats" asChild>
          <TouchableOpacity>
            <Icon icon={TrendingUp} />
          </TouchableOpacity>
        </Link>
      </View>
      <View className="border-gray-75 border-b pb-2 dark:border-gray-800">
        <ScrollView
          ref={scrollViewRef}
          pagingEnabled
          style={{ flexGrow: 0 }}
          // onLayout={() => scrollViewRef.current?.scrollToEnd()}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {weeks.map((week) => (
            <Week key={week.toISOString()} week={week} />
          ))}
        </ScrollView>
      </View>

      <HabitsListContainer />
      <View pointerEvents="box-none" className="absolute bottom-4 right-4 gap-1">
        <TouchableOpacity
          onPress={() => {
            scrollViewRef.current?.scrollToEnd()
            setDate(new Date())
          }}
          className="sq-14 flex items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-600 dark:bg-black"
        >
          <Icon icon={Calendar} size={24} />
        </TouchableOpacity>
        <Link href={"/habits/new"} asChild>
          <TouchableOpacity className="bg-primary-500/90 sq-14 flex items-center justify-center rounded-full">
            <Icon icon={Plus} size={24} color="black" />
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  )
}

const Week = React.memo(function _Week(props: { week: dayjs.Dayjs }) {
  return (
    <View style={{ width, flexDirection: "row" }}>
      {Array.from({ length: 7 }).map((_, dayIndex) => (
        <HabitDay
          // biome-ignore lint/suspicious/noArrayIndexKey: staic
          key={dayIndex}
          day={props.week.add(dayIndex, "day")}
        />
      ))}
    </View>
  )
})

function HabitDay({ day }: { day: dayjs.Dayjs }) {
  const setDate = useActiveDate((s) => s.setDate)
  return (
    <TouchableOpacity
      disabled={dayjs().isBefore(dayjs(day), "date")}
      style={{ width: width / 7, display: "flex", alignItems: "center" }}
      onPress={() => setDate(dayjs(day).startOf("day").add(12, "hours").toDate())}
      className={join("flex flex-col items-center", dayjs().isBefore(dayjs(day), "date") && "opacity-50")}
    >
      <Text>{dayjs(day).format("ddd")}</Text>
      <HabitDayDate day={day} />
    </TouchableOpacity>
  )
}

function HabitDayDate({ day }: { day: dayjs.Dayjs }) {
  const { date } = useActiveDate()

  const isActive = dayjs(day).isSame(dayjs(date), "date")
  return (
    <View
      className={join(
        "flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 dark:border-gray-700",
        isActive && "bg-black dark:bg-white",
        dayjs(day).isSame(dayjs(), "date") && "border-primary",
      )}
    >
      <Text className={join("text-xs", isActive && "text-white dark:text-black")}>{dayjs(day).date()}</Text>
    </View>
  )
}

function HabitsListContainer() {
  const date = useActiveDate((s) => s.date)

  const { data, isLoading } = api.habit.allByDate.useQuery({ date }, { keepPreviousData: true })

  return (
    <>
      {isLoading ? (
        <View className="flex items-center justify-center pt-4">
          <ActivityIndicator />
        </View>
      ) : !data ? (
        <View className="flex items-center justify-center pt-4">
          <Text>Error loading habits</Text>
        </View>
      ) : (
        <HabitsList data={data} />
      )}
    </>
  )
}

const HABIT_HEIGHT = 65
type Positions = { [key: string]: Habit }
function HabitsList({ data }: { data: NonNullable<RouterOutputs["habit"]["allByDate"]> }) {
  const habits = data.habits
  const habitEntries = data.habitEntries

  const posistions = useSharedValue(
    habits.reduce<Positions>((acc, habit) => {
      acc[habit.id] = habit
      return acc
    }, {}),
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: allow
  React.useEffect(() => {
    posistions.value = habits.reduce<Positions>((acc, habit) => {
      acc[habit.id] = habit
      return acc
    }, {})
  }, [habits])

  return (
    <Animated.ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        marginTop: 8,
        minHeight: data.habits.length * HABIT_HEIGHT + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      {habits.map((habit) => (
        <HabitItem
          key={habit.id}
          positions={posistions}
          habit={habit}
          isComplete={habitEntries.some((entry) => entry.habitId === habit.id)}
        />
      ))}
    </Animated.ScrollView>
  )
}

function HabitItem({ habit, isComplete, positions }: { positions: SharedValue<Positions>; habit: Habit; isComplete: boolean }) {
  const date = useActiveDate((s) => s.date)
  const isDark = useColorScheme() === "dark"
  const utils = api.useUtils()
  const router = useRouter()
  const toggleComplete = api.habit.toggleComplete.useMutation({
    onMutate: () => {
      utils.habit.allByDate.setData({ date }, (old) => ({
        habits: old?.habits || [],
        habitEntries: old?.habitEntries?.find((entry) => entry.habitId === habit.id)
          ? old.habitEntries.filter((entry) => entry.habitId !== habit.id)
          : [...(old?.habitEntries || []), { id: "test", createdAt: dayjs().toDate(), habitId: habit.id }],
      }))
    },
    onSuccess: () => {
      if (dayjs(date).isSame(dayjs(), "date")) {
        void utils.habit.progressToday.invalidate()
      }
    },
  })

  const deleteHabit = api.habit.delete.useMutation({
    onSuccess: () => {
      if (dayjs(date).isSame(dayjs(), "date")) {
        void utils.habit.progressToday.invalidate()
      }
      void utils.habit.allByDate.invalidate({ date })
    },
  })
  const archiveHabit = api.habit.archive.useMutation({
    onSuccess: () => {
      if (dayjs(date).isSame(dayjs(), "date")) {
        void utils.habit.progressToday.invalidate()
      }
      void utils.habit.allByDate.invalidate({ date })
    },
  })

  const handleToggleComplete = () => toggleComplete.mutate({ id: habit.id, date })

  const { showActionSheetWithOptions } = useActionSheet()
  const handleOpenMenu = () => {
    const options = ["Cancel", "Edit", "Archive", "Delete"]
    const destructiveButtonIndex = 3

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const cancelButtonIndex = 0
    showActionSheetWithOptions({ options, cancelButtonIndex, destructiveButtonIndex }, (selectedIndex) => {
      switch (selectedIndex) {
        case cancelButtonIndex:
          // Canceled
          break
        case 1:
          // Edit
          router.push(`/habits/${habit.id}?date=${dayjs(date).toISOString()}`)
          break
        case 2:
          // Archive
          archiveHabit.mutate({ id: habit.id, date })
          break
        case destructiveButtonIndex:
          deleteHabit.mutate({ id: habit.id })
          break
      }
    })
  }

  const { mutate } = api.habit.updateOrder.useMutation()

  const handleUpdateOrder = () => {
    if (!positions.value) return
    if (positions.value[habit.id]?.order === habit.order) return
    const data = Object.values(positions.value).map((habit) => ({ id: habit.id, order: habit.order }))
    mutate(data)
  }

  const translateY = useSharedValue(
    (positions.value[habit.id] ? positions.value[habit.id]!.order : Object.values(positions.value).length) * HABIT_HEIGHT,
  )
  const offsetY = useSharedValue(translateY.value)
  const scale = useSharedValue(1)
  const isActive = useSharedValue(false)

  useAnimatedReaction(
    () => positions.value[habit.id]!,
    (newPosition) => {
      const y = newPosition.order * HABIT_HEIGHT
      translateY.value = withTiming(y)
    },
  )

  const styles = useAnimatedStyle(() => {
    return {
      position: "absolute",
      width: "100%",
      zIndex: isActive.value ? 10 : 0,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }
  })

  const pan = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      offsetY.value = translateY.value
      scale.value = withTiming(1.05)
      isActive.value = true
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium)
    })
    .onUpdate((event) => {
      translateY.value = Math.max(offsetY.value + event.translationY, 0)

      const currentHabit = positions.value[habit.id]!
      const newPositions = { ...positions.value }
      const newOrder = Math.floor((translateY.value + HABIT_HEIGHT * 0.5) / HABIT_HEIGHT)
      // reorder current date tasks
      const habitToSwap = Object.values(newPositions).find((t) => t.order === newOrder)
      if (!habitToSwap || habitToSwap.id === currentHabit.id) return
      newPositions[currentHabit.id]! = {
        ...currentHabit,
        order: newOrder,
      }
      newPositions[habitToSwap.id]! = {
        ...habitToSwap,
        order: currentHabit.order,
      }
      positions.value = newPositions
    })
    .onEnd(() => {
      const newOrder = positions.value[habit.id]!.order
      translateY.value = withTiming(newOrder * HABIT_HEIGHT)
      runOnJS(handleUpdateOrder)()
    })
    .onFinalize(() => {
      scale.value = withTiming(1, undefined, () => {
        isActive.value = false
      })
    })

  const longPress = Gesture.LongPress().minDuration(800).runOnJS(true).onStart(handleOpenMenu)

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onStart(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      handleToggleComplete()
    })

  const gesture = Gesture.Race(Gesture.Simultaneous(pan, longPress), tap)
  return (
    <Animated.View style={styles}>
      <GestureDetector gesture={gesture}>
        <TouchableOpacity activeOpacity={0.7} style={{ height: HABIT_HEIGHT }} className="w-full px-4 py-1">
          <View className="flex h-full w-full flex-row items-center justify-between rounded border border-gray-100 bg-white p-3 px-4 dark:border-gray-700 dark:bg-black">
            <Text className="text-lg">{habit.name}</Text>

            <View className="flex flex-row items-center gap-2">
              {habit.reminders.length > 0 && (
                <View className="flex flex-row items-center gap-1 opacity-70">
                  <Text className="text-xs">{habit.reminders.length}x</Text>
                  <Icon icon={Clock} size={14} />
                </View>
              )}

              <View className="relative">
                <Circle
                  size={26}
                  strokeWidth={1}
                  color={isComplete ? colors.primary[500] : isDark ? colors.gray[700] : colors.gray[100]}
                  fill={isComplete ? colors.primary[500] : "transparent"}
                />
                {isComplete && (
                  <View style={StyleSheet.absoluteFill} className="flex items-center justify-center">
                    <Icon icon={Check} size={16} strokeWidth={3} fill="transparent" color="white" />
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </GestureDetector>
    </Animated.View>
  )
}
