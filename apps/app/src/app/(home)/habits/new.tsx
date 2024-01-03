import { useRouter } from "expo-router"

import { HabitForm } from "../../../components/HabitForm"
import { ModalView } from "../../../components/ModalView"
import { api } from "../../../lib/utils/api"

export default function NewHabit() {
  const utils = api.useUtils()
  const router = useRouter()
  const createHabit = api.habit.create.useMutation({
    onSuccess: async () => {
      await utils.habit.today.invalidate()
      void utils.habit.progressCompleteToday.invalidate()
      router.back()
    },
  })

  return (
    <ModalView title="New habit">
      <HabitForm
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        error={createHabit.error?.data}
        isLoading={createHabit.isLoading}
        onCreate={createHabit.mutate}
      />
    </ModalView>
  )
}
