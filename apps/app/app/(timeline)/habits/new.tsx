import { useRouter, useSearchParams } from "expo-router"
import * as React from "react"
import { View } from "react-native"
import { Button } from "../../../src/components/Button"
import { FormError } from "../../../src/components/FormError"
import { FormInput } from "../../../src/components/FormInput"
import { ModalView } from "../../../src/components/ModalView"
import { api } from "../../../src/lib/utils/api"

export default function NewHabit() {
  const params = useSearchParams()
  const date = params.date as string
  const [name, setName] = React.useState("")
  const utils = api.useContext()
  const router = useRouter()
  const createHabit = api.habit.create.useMutation({
    onSuccess: async () => {
      await utils.habit.all.invalidate({ date })
      router.back()
    },
  })

  const handleCreate = () => {
    createHabit.mutate({ name, startDate: date })
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
