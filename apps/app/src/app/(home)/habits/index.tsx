import * as React from "react"
import { ActivityIndicator, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useActionSheet } from "@expo/react-native-action-sheet"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import * as Haptics from "expo-haptics"
import { Link, useRouter } from "expo-router"
import { Check, Circle, Clock, GripVertical, Plus, TrendingUp } from "lucide-react-native"

import colors from "@element/tailwind-config/src/colors"

import { Heading } from "../../../components/Heading"
import { Icon } from "../../../components/Icon"
import { Text } from "../../../components/Text"
import { api, type RouterOutputs } from "../../../lib/utils/api"

dayjs.extend(advancedFormat)

type Habit = NonNullable<RouterOutputs["habit"]["byDate"]>["habits"][number]

export default function Habits() {
  const [date, _setDate] = React.useState(new Date())
  const { data, isLoading } = api.habit.byDate.useQuery({ date })

  // const dateLabel = dayjs(date).isSame(dayjs(), "date")
  //   ? "Today"
  //   : // if yesterday
  //     dayjs(date).isSame(dayjs().subtract(1, "day"), "date")
  //     ? "Yesterday"
  //     : // if tomorrow
  //       dayjs(date).isSame(dayjs().add(1, "day"), "date")
  //       ? "Tomorrow"
  //       : dayjs(date).format("ddd Do")

  return (
    <View className="relative w-full flex-1 pt-16">
      <View className="flex flex-row items-center justify-between px-4 pb-2">
        <Heading className="text-3xl">Habits</Heading>
        <Link href="/habits/stats" asChild>
          <TouchableOpacity>
            <Icon icon={TrendingUp} />
          </TouchableOpacity>
        </Link>
      </View>
      {isLoading ? (
        <View className="flex items-center justify-center pt-4">
          <ActivityIndicator />
        </View>
      ) : !data ? (
        <View className="flex items-center justify-center pt-4">
          <Text>Error loading habits</Text>
        </View>
      ) : (
        <HabitsList data={data} date={date} />
      )}
      <View className="absolute bottom-4 right-4">
        <Link href={`/habits/new`} asChild>
          <TouchableOpacity className="bg-primary-500/90 rounded-full p-4">
            <Icon icon={Plus} size={24} color="black" />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  )
}

const HABIT_HEIGHT = 65
type Positions = { [key: string]: Habit }

function HabitsList({ data, date }: { data: NonNullable<RouterOutputs["habit"]["byDate"]>; date: Date }) {
  const habits = data.habits
  const habitEntries = data.habitEntries

  const posistions = useSharedValue(
    habits.reduce<Positions>((acc, habit) => {
      acc[habit.id] = habit
      return acc
    }, {}),
  )

  React.useEffect(() => {
    posistions.value = habits.reduce<Positions>((acc, habit) => {
      acc[habit.id] = habit
      return acc
    }, {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits])

  // const scrollRef = useAnimatedRef<Animated.ScrollView>()
  // const scrollTranslateY = useSharedValue(0)
  // const scrollViewSize = useSharedValue(0)

  // const onListContentSizeChange = (_: number, h: number) => {
  //   scrollViewSize.value = h
  // }

  // console.log(scrollViewSize.value)

  // useAnimatedReaction(
  //   () => scrollTranslateY.value,
  //   (y) => {
  //     if (!scrollRef.current) return
  //     scrollRef.current?.scrollTo({ y, animated: true })
  //   },
  // )

  // const onScroll = useAnimatedScrollHandler((e) => {
  //   scrollTranslateY.value = e.contentOffset.y
  // })

  return (
    <Animated.ScrollView
      // ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        minHeight: data.habits.length * HABIT_HEIGHT + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      {habits.map((habit) => (
        <HabitItem
          key={habit.id}
          positions={posistions}
          habit={habit}
          date={date}
          isComplete={habitEntries.some((entry) => entry.habitId === habit.id)}
        />
      ))}
    </Animated.ScrollView>
  )
}

function HabitItem({
  date,
  habit,
  isComplete,
  positions,
}: {
  date: Date
  positions: SharedValue<Positions>
  habit: Habit
  isComplete: boolean
}) {
  const isDark = useColorScheme() === "dark"
  const utils = api.useUtils()
  const router = useRouter()
  const toggleComplete = api.habit.toggleComplete.useMutation({
    onMutate: () => {
      utils.habit.byDate.setData({ date }, (old) => ({
        habits: old?.habits || [],
        habitEntries: old?.habitEntries?.find((entry) => entry.habitId === habit.id)
          ? old.habitEntries.filter((entry) => entry.habitId !== habit.id)
          : [...(old?.habitEntries || []), { id: "test", createdAt: dayjs().toDate(), habitId: habit.id }],
      }))
    },
    onSuccess: () => {
      void utils.habit.progressToday.invalidate()
    },
  })

  const deleteHabit = api.habit.delete.useMutation({
    onSuccess: () => {
      void utils.habit.progressToday.invalidate()
      void utils.habit.byDate.invalidate()
    },
  })
  const archiveHabit = api.habit.archive.useMutation({
    onSuccess: () => {
      void utils.habit.progressToday.invalidate()
      void utils.habit.byDate.invalidate()
    },
  })

  const handleToggleComplete = () => toggleComplete.mutate({ id: habit.id })

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
          router.push(`/habits/${habit.id}`)
          break
        case 2:
          // Archive
          archiveHabit.mutate({ id: habit.id })
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

  const longPress = Gesture.LongPress()
    .minDuration(800)
    .runOnJS(true)
    .onStart(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      handleOpenMenu()
    })

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
        <View style={{ height: HABIT_HEIGHT }} className="w-full px-4 py-1">
          <View className="flex h-full w-full flex-row items-center justify-between rounded border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-black">
            <View className="flex flex-row items-center space-x-2">
              <Icon icon={GripVertical} size={16} />
              <Text className="text-lg">{habit.name}</Text>
            </View>
            <View className="flex flex-row items-center space-x-2">
              {habit.reminderTime && (
                <View className="flex flex-row items-center space-x-1 opacity-70">
                  <Icon icon={Clock} size={14} />
                  <Text className="text-xs">
                    {habit.reminderTime.getHours().toString().padStart(2, "0")}:
                    {habit.reminderTime.getMinutes().toString().padStart(2, "0")}
                  </Text>
                </View>
              )}

              <View className="relative">
                <Circle
                  size={26}
                  color={isComplete ? colors.primary[500] : isDark ? colors.gray[700] : colors.gray[100]}
                  fill={isComplete ? colors.primary[500] : "transparent"}
                />
                {isComplete && (
                  <View style={StyleSheet.absoluteFill} className="flex items-center justify-center">
                    <Icon icon={Check} size={18} strokeWidth={3} fill="transparent" color="white" />
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </GestureDetector>
    </Animated.View>
  )
}
