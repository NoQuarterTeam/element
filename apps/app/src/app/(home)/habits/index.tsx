import { ScrollView, TouchableOpacity, useColorScheme, View } from "react-native"
import { useActionSheet } from "@expo/react-native-action-sheet"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import * as Haptics from "expo-haptics"
import { Link, useRouter } from "expo-router"
import { Check, Circle, Clock, Plus } from "lucide-react-native"

import colors from "@element/tailwind-config/src/colors"

import { Heading } from "../../../components/Heading"
import { Icon } from "../../../components/Icon"
import { Text } from "../../../components/Text"
import { api, type RouterOutputs } from "../../../lib/utils/api"

dayjs.extend(advancedFormat)

type Habit = NonNullable<RouterOutputs["habit"]["today"]>["habits"][number]
type HabitEntries = NonNullable<RouterOutputs["habit"]["today"]>["habitEntries"]

export default function Habits() {
  const { data } = api.habit.today.useQuery()
  const habits = data?.habits || []
  const habitEntries = data?.habitEntries || []
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
    <View className="relative w-full flex-1 px-4 pt-16">
      <Heading className="pb-2 text-3xl">Habits</Heading>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="space-y-2"
      >
        {habits.map((habit) => (
          <View key={habit.id}>
            <HabitItem habit={habit} entries={habitEntries.filter((entry) => entry.habitId === habit.id)} />
          </View>
        ))}
      </ScrollView>
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

function HabitItem({ habit, entries }: { habit: Habit; entries: HabitEntries }) {
  const isComplete = entries.length > 0
  const isDark = useColorScheme() === "dark"
  const utils = api.useUtils()
  const router = useRouter()
  const toggleComplete = api.habit.toggleComplete.useMutation({
    onMutate: () => {
      utils.habit.today.setData(undefined, (old) => ({
        habits: old?.habits || [],
        habitEntries: old?.habitEntries?.find((entry) => entry.habitId === habit.id)
          ? old.habitEntries.filter((entry) => entry.habitId !== habit.id)
          : [...(old?.habitEntries || []), { id: "test", createdAt: dayjs().toDate(), habitId: habit.id }],
      }))
    },
    onSuccess: () => {
      void utils.habit.progressCompleteToday.invalidate()
    },
  })

  const deleteHabit = api.habit.delete.useMutation({
    onSuccess: () => {
      void utils.habit.progressCompleteToday.invalidate()
      void utils.habit.today.invalidate()
    },
  })
  const archiveHabit = api.habit.archive.useMutation({
    onSuccess: () => {
      void utils.habit.progressCompleteToday.invalidate()
      void utils.habit.today.invalidate()
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
  return (
    <TouchableOpacity
      className="flex flex-row items-center justify-between rounded border border-gray-100 p-3 dark:border-gray-700"
      onPress={handleToggleComplete}
      onLongPress={handleOpenMenu}
      activeOpacity={0.6}
    >
      <Text className="text-lg">{habit.name}</Text>
      <View className="flex flex-row items-center space-x-2">
        {habit.reminderTime && (
          <View className="flex flex-row items-center space-x-1 opacity-70">
            <Icon icon={Clock} size={14} />
            <Text className="text-xs">
              {habit.reminderTime.getHours()}:{habit.reminderTime.getMinutes()}
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
            <View className="absolute left-1 top-[5px]">
              <Icon icon={Check} size={18} strokeWidth={3} fill="transparent" color="white" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}
