import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useRouter, useSearchParams } from "expo-router"
import { TouchableOpacity, useColorScheme, View } from "react-native"
import { ModalView } from "../../components/ModalView"
import { Text } from "../../components/Text"
import { api, RouterOutputs } from "../../lib/utils/api"
import { Button } from "../../components/Button"

dayjs.extend(advancedFormat)

type Habit = NonNullable<RouterOutputs["habit"]["all"]>["habits"][number]
type HabitEntries = NonNullable<RouterOutputs["habit"]["all"]>["habitEntries"]

export default function Habits() {
  const params = useSearchParams()
  const date = params.date as string
  const router = useRouter()
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
      <View className="space-y-3 pt-4">
        {habits.map((habit) => (
          <View key={habit.id}>
            <HabitItem date={date} habit={habit} entries={habitEntries.filter((entry) => entry.habitId === habit.id)} />
          </View>
        ))}
        <Button variant="outline" onPress={() => router.push({ pathname: "habits/new" })}>
          New habit
        </Button>
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
  const handleToggleComplete = () => toggleComplete.mutate({ id: habit.id, date })
  return (
    <TouchableOpacity className="flex flex-row items-center justify-between" onPress={handleToggleComplete}>
      <Text className="text-lg">{habit.name}</Text>
      {isComplete ? (
        <Ionicons name="checkbox" size={30} color="#E87B35" />
      ) : (
        <Ionicons name="square-outline" size={30} color={colorScheme === "dark" ? "#777" : "#aaa"} />
      )}
    </TouchableOpacity>
  )
}
