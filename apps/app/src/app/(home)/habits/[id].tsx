import * as React from "react"
import { KeyboardAvoidingView, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { useGlobalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"

import { Button } from "../../../components/Button"
import { FormError } from "../../../components/FormError"
import { FormInput } from "../../../components/FormInput"
import { ModalView } from "../../../components/ModalView"
import { api, type RouterOutputs } from "../../../lib/utils/api"

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

  const [name, setName] = React.useState(habit.name)
  const utils = api.useUtils()
  const updateHabit = api.habit.update.useMutation({
    onSuccess: async () => {
      void utils.habit.byId.invalidate({ id: habit.id })
      await utils.habit.today.invalidate()
      router.back()
    },
  })

  const handleUpdate = () => {
    updateHabit.mutate({ id: habit.id, name })
  }

  return (
    <KeyboardAvoidingView behavior="padding" enabled keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={{ minHeight: "100%", paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="space-y-2">
          <FormInput
            label="Name"
            autoFocus
            value={name}
            error={updateHabit.error?.data?.zodError?.fieldErrors?.name}
            onChangeText={setName}
          />
          <View className="space-y-1">
            <View>
              <Button isLoading={updateHabit.isLoading} size="sm" onPress={handleUpdate}>
                Update
              </Button>
            </View>
            {updateHabit.error?.data?.formError && (
              <View>
                <FormError error={updateHabit.error.data.formError} />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
