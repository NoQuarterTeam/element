import * as React from "react"
import { ScrollView, View } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Link, useRouter } from "expo-router"

import { Button } from "../../components/Button"
import { FormError } from "../../components/FormError"
import { FormInput } from "../../components/FormInput"
import { ModalView } from "../../components/ModalView"
import { Text } from "../../components/Text"
import { api, AUTH_TOKEN } from "../../lib/utils/api"
import { registerPushToken } from "../../lib/registerPushToken"

export default function Register() {
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  const queryClient = api.useUtils()
  const router = useRouter()

  const pushToken = api.pushToken.create.useMutation()
  const register = api.user.register.useMutation({
    onSuccess: async (data) => {
      await AsyncStorage.setItem(AUTH_TOKEN, data.token)
      queryClient.user.me.setData(undefined, data.user)
      router.replace("/")
      const token = await registerPushToken()
      if (!token) return
      pushToken.mutate({ token })
    },
  })

  const handleLogin = async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN)
    register.mutate(form)
  }

  return (
    <ModalView title="Register">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 400 }}
        showsHorizontalScrollIndicator={false}
      >
        <View className="space-y-1">
          <View>
            <FormInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              error={register.error?.data?.zodError?.fieldErrors.email}
            />
          </View>
          <View>
            <FormInput
              secureTextEntry
              label="Password"
              value={form.password}
              onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
              error={register.error?.data?.zodError?.fieldErrors.password}
            />
          </View>
          <View>
            <FormInput
              label="First name"
              value={form.firstName}
              onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
              error={register.error?.data?.zodError?.fieldErrors.firstName}
            />
          </View>
          <View>
            <FormInput
              secureTextEntry
              label="Last name"
              value={form.lastName}
              onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
              error={register.error?.data?.zodError?.fieldErrors.lastName}
            />
          </View>
          <View>
            <Button isLoading={register.isLoading} disabled={register.isLoading} onPress={handleLogin}>
              Register
            </Button>
          </View>
          {register.error?.data?.formError && (
            <View>
              <FormError error={register.error.data.formError} />
            </View>
          )}
        </View>
        <View className="flex flex-row items-center justify-center py-3">
          <View className="mr-3 h-px flex-1 bg-gray-100 dark:bg-gray-600"></View>
          <Text className="opacity-60">or</Text>
          <View className="ml-3 h-px flex-1 bg-gray-100 dark:bg-gray-600"></View>
        </View>
        <View className="space-y-2">
          <Link href="/login" asChild replace>
            <Button variant="outline">Login</Button>
          </Link>
        </View>
      </ScrollView>
    </ModalView>
  )
}
