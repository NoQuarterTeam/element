import { ScrollView, TouchableOpacity, useColorScheme, View } from "react-native"
import { useActionSheet } from "@expo/react-native-action-sheet"
import Feather from "@expo/vector-icons/Feather"
import Octicons from "@expo/vector-icons/Octicons"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import { Link, useRouter } from "expo-router"

import colors from "@element/tailwind-config/src/colors"

import { Text } from "../../../components/Text"
import { api, type RouterOutputs } from "../../../lib/utils/api"
import { Heading } from "../../../components/Heading"

dayjs.extend(advancedFormat)

type Habit = NonNullable<RouterOutputs["habit"]["all"]>["habits"][number]
type HabitEntries = NonNullable<RouterOutputs["habit"]["all"]>["habitEntries"]

export default function Habits() {
  const { data } = api.habit.all.useQuery()
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
      <Heading className="text-3xl">Habits</Heading>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} className="space-y-3">
        {habits.map((habit) => (
          <View key={habit.id}>
            <HabitItem habit={habit} entries={habitEntries.filter((entry) => entry.habitId === habit.id)} />
          </View>
        ))}
      </ScrollView>
      <View className="absolute bottom-4 right-4">
        <Link href={`/habits/new`} asChild>
          <TouchableOpacity className="bg-primary-500/90 rounded-full p-4">
            <Feather name="plus" size={24} />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  )
}

function HabitItem({ habit, entries }: { habit: Habit; entries: HabitEntries }) {
  const isComplete = entries.length > 0
  const colorScheme = useColorScheme()
  const utils = api.useUtils()
  const router = useRouter()
  const toggleComplete = api.habit.toggleComplete.useMutation({
    onMutate: () => {
      utils.habit.all.setData(undefined, (old) => ({
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
      void utils.habit.all.invalidate()
    },
  })
  const archiveHabit = api.habit.archive.useMutation({
    onSuccess: () => {
      void utils.habit.progressCompleteToday.invalidate()
      void utils.habit.all.invalidate()
    },
  })

  const handleToggleComplete = () => toggleComplete.mutate({ id: habit.id })

  const { showActionSheetWithOptions } = useActionSheet()
  const handleOpenMenu = () => {
    const options = ["Cancel", "Edit", "Archive", "Delete"]
    const destructiveButtonIndex = 3
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
      className="flex flex-row items-center justify-between py-1 pr-2"
      onPress={handleToggleComplete}
      activeOpacity={0.8}
      onLongPress={handleOpenMenu}
    >
      <Text className="text-lg">{habit.name}</Text>
      {isComplete ? (
        <Octicons name="check-circle-fill" size={24} color={colors.primary[600]} />
      ) : (
        <Octicons name="circle" size={24} color={colorScheme === "dark" ? colors.gray[600] : colors.gray[100]} />
      )}
    </TouchableOpacity>
  )
}
