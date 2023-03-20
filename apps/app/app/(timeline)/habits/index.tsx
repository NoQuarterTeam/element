import Ionicons from "@expo/vector-icons/Ionicons"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import { Link, useSearchParams } from "expo-router"
import Feather from "@expo/vector-icons/Feather"
import { TouchableOpacity, useColorScheme, View } from "react-native"
import { ModalView } from "../../../components/ModalView"
import { Text } from "../../../components/Text"
import { api, RouterOutputs } from "../../../lib/utils/api"
import { useActionSheet } from "@expo/react-native-action-sheet"
import colors from "@element/tailwind-config/colors"

dayjs.extend(advancedFormat)

type Habit = NonNullable<RouterOutputs["habit"]["all"]>["habits"][number]
type HabitEntries = NonNullable<RouterOutputs["habit"]["all"]>["habitEntries"]

export default function Habits() {
  const params = useSearchParams()
  const date = params.date as string
  const { data } = api.habit.all.useQuery({ date })
  const habits = data?.habits || []
  const habitEntries = data?.habitEntries || []
  const dateLabel = dayjs(date).isSame(dayjs(), "date")
    ? "Today"
    : // if yesterday
    dayjs(date).isSame(dayjs().subtract(1, "day"), "date")
    ? "Yesterday"
    : // if tomorrow
    dayjs(date).isSame(dayjs().add(1, "day"), "date")
    ? "Tomorrow"
    : dayjs(date).format("ddd Do")

  return (
    <ModalView title={`Habits - ${dateLabel}`}>
      <View className="h-full flex-1 space-y-3 pt-4">
        {habits.map((habit) => (
          <View key={habit.id}>
            <HabitItem date={date} habit={habit} entries={habitEntries.filter((entry) => entry.habitId === habit.id)} />
          </View>
        ))}
        <View className="absolute bottom-8 w-full items-center justify-center">
          <Link href={`/habits/new?date=${date}`} asChild>
            <TouchableOpacity className="bg-primary-500/90 rounded-full p-4">
              <Feather name="plus" size={24} />
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ModalView>
  )
}

function HabitItem({ habit, entries, date }: { date: string; habit: Habit; entries: HabitEntries }) {
  const isComplete = entries.length > 0
  const colorScheme = useColorScheme()
  const utils = api.useContext()
  const toggleComplete = api.habit.toggleComplete.useMutation({
    onSuccess: () => {
      utils.habit.progressCompleteByDate.invalidate({ date })
      utils.habit.all.invalidate({ date })
    },
  })

  const deleteHabit = api.habit.delete.useMutation({
    onSuccess: () => {
      utils.habit.progressCompleteByDate.invalidate({ date })
      utils.habit.all.invalidate({ date })
    },
  })
  const archiveHabit = api.habit.archive.useMutation({
    onSuccess: () => {
      utils.habit.progressCompleteByDate.invalidate({ date })
      utils.habit.all.invalidate({ date })
    },
  })

  const handleToggleComplete = () => toggleComplete.mutate({ id: habit.id, date })

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
  return (
    <TouchableOpacity
      className="flex flex-row items-center justify-between"
      onPress={handleToggleComplete}
      onLongPress={handleOpenMenu}
    >
      <Text className="text-lg">{habit.name}</Text>
      {isComplete ? (
        <Ionicons name="checkbox" size={30} color={colors.primary[600]} />
      ) : (
        <Ionicons name="square-outline" size={30} color={colorScheme === "dark" ? colors.gray[600] : colors.gray[200]} />
      )}
    </TouchableOpacity>
  )
}
