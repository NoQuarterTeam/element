import * as React from "react"
import { View } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "../../../components/Button"
import { FormError } from "../../../components/FormError"
import { FormInput } from "../../../components/FormInput"
import { ModalView } from "../../../components/ModalView"
import { api } from "../../../lib/utils/api"

export default function NewHabit() {
  const [name, setName] = React.useState("")
  const utils = api.useUtils()
  const router = useRouter()
  const createHabit = api.habit.create.useMutation({
    onSuccess: async () => {
      await utils.habit.today.invalidate()
      router.back()
    },
  })

  const handleCreate = () => {
    createHabit.mutate({ name })
  }

  return (
    <ModalView title="New habit">
      <View className="space-y-2">
        <FormInput
          label="Name"
          autoFocus
          value={name}
          error={createHabit.error?.data?.zodError?.fieldErrors?.name}
          onChangeText={setName}
        />
        <View className="space-y-1">
          <View>
            <Button isLoading={createHabit.isLoading} size="sm" onPress={handleCreate}>
              Create
            </Button>
          </View>
          {createHabit.error?.data?.formError && (
            <View>
              <FormError error={createHabit.error.data.formError} />
            </View>
          )}
        </View>
      </View>
    </ModalView>
  )
}
