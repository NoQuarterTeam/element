import { useRouter, useSearchParams } from "expo-router"
import * as React from "react"
import { View } from "react-native"
import { Button } from "../../../components/Button"
import { FormInput } from "../../../components/FormInput"
import { ModalView } from "../../../components/ModalView"
import { api } from "../../../lib/utils/api"

export default function NewHabit() {
  const params = useSearchParams()
  const date = params.date as string
  const [name, setName] = React.useState("")
  const utils = api.useContext()
  const router = useRouter()
  const createHabit = api.habit.create.useMutation({
    onSuccess: () => {
      utils.habit.all.invalidate({ date })
      router.back()
    },
  })
  const handleCreate = () => {
    if (!name) return
    createHabit.mutate({ name, startDate: date })
  }

  return (
    <ModalView title="New habit">
      <View className="space-y-2">
        <FormInput label="Name" autoFocus value={name} onChangeText={setName} />
        <View className="flex flex-row space-x-2">
          <Button isLoading={createHabit.isLoading} className="flex-1" size="sm" onPress={handleCreate}>
            Create
          </Button>
        </View>
      </View>
    </ModalView>
  )
}
