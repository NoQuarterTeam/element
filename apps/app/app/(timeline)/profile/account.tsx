import { useRouter } from "expo-router"
import * as React from "react"
import { KeyboardAvoidingView, ScrollView, View } from "react-native"
import { Button } from "../../../components/Button"
import { FormInput } from "../../../components/FormInput"
import { ScreenView } from "../../../components/ScreenView"
import { api } from "../../../lib/utils/api"

export default function Account() {
  const { data } = api.auth.me.useQuery()
  const [form, setForm] = React.useState({
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    email: data?.email || "",
  })
  const router = useRouter()
  const utils = api.useContext()
  const updateMe = api.auth.update.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  })
  const handleUpdate = () => {
    updateMe.mutate(form)
    router.back()
  }
  return (
    <ScreenView title="Account">
      <KeyboardAvoidingView>
        <ScrollView className="h-full space-y-2 pt-4">
          <View>
            <FormInput label="Email" value={form.email} onChangeText={(email) => setForm((f) => ({ ...f, email }))} />
          </View>
          <View>
            <FormInput
              label="First name"
              value={form.firstName}
              onChangeText={(firstName) => setForm((f) => ({ ...f, firstName }))}
            />
          </View>
          <View>
            <FormInput
              label="Last name"
              value={form.lastName}
              onChangeText={(lastName) => setForm((f) => ({ ...f, lastName }))}
            />
          </View>
          <View>
            <Button size="sm" onPress={handleUpdate}>
              Update
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenView>
  )
}
