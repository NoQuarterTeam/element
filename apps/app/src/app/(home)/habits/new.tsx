import { useRouter } from "expo-router"

import { HabitForm } from "../../../components/HabitForm"
import { ModalView } from "../../../components/ModalView"
import { api } from "../../../lib/utils/api"

export default function NewHabit() {
  const utils = api.useUtils()
  const router = useRouter()
  const createHabit = api.habit.create.useMutation({
    onSuccess: async () => {
      await utils.habit.byDate.invalidate()
      void utils.habit.progressToday.invalidate()
      router.back()
    },
  })

  return (
    <ModalView title="New habit">
      <HabitForm error={createHabit.error?.data} isLoading={createHabit.isLoading} onCreate={createHabit.mutate} />
    </ModalView>
  )
}
