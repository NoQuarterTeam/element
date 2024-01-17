import { KeyboardAvoidingView } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { useGlobalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"

import { HabitForm } from "../../../components/HabitForm"
import { ModalView } from "../../../components/ModalView"
import { api, type RouterOutputs } from "../../../lib/utils/api"
import dayjs from "dayjs"

type Habit = NonNullable<RouterOutputs["habit"]["byId"]>
export default function HabitDetail() {
  const { id } = useGlobalSearchParams()

  const { data, isLoading } = api.habit.byId.useQuery({ id: id as string })

  return (
    <ModalView title="Edit habit">
      {isLoading || !data ? null : <EditHabitForm habit={data} />}
      <StatusBar style="light" />
    </ModalView>
  )
}

function EditHabitForm({ habit }: { habit: Habit }) {
  const router = useRouter()
  const { date } = useGlobalSearchParams()
  const utils = api.useUtils()
  const updateHabit = api.habit.update.useMutation({
    onSuccess: async () => {
      void utils.habit.byId.invalidate({ id: habit.id })
      if (!date) return
      await utils.habit.allByDate.invalidate({
        date: dayjs(date as string)
          .startOf("day")
          .add(12, "hours")
          .toDate(),
      })
      router.back()
    },
  })

  return (
    <KeyboardAvoidingView behavior="padding" enabled keyboardVerticalOffset={100}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <HabitForm
          error={updateHabit.error?.data}
          isLoading={updateHabit.isLoading}
          habit={habit}
          onUpdate={updateHabit.mutate}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
