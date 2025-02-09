import AsyncStorage from "@react-native-async-storage/async-storage"
import { Link, useRouter } from "expo-router"
import * as React from "react"
import { ScrollView, View } from "react-native"

import { Button } from "~/components/Button"
import { FormError } from "~/components/FormError"
import { FormInput } from "~/components/FormInput"
import { ModalView } from "~/components/ModalView"
import { Text } from "~/components/Text"
import { registerPushToken } from "~/lib/registerPushToken"
import { AUTH_TOKEN, api } from "~/lib/utils/api"

export default function Login() {
  const utils = api.useUtils()
  const router = useRouter()
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  const pushToken = api.pushToken.create.useMutation()
  const login = api.user.login.useMutation({
    onSuccess: async (data) => {
      await AsyncStorage.setItem(AUTH_TOKEN, data.token)
      utils.user.me.refetch()
      const token = await registerPushToken()
      if (token) pushToken.mutate({ token })
      router.replace("/(home)/(timeline)")
    },
  })
  const handleLogin = async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN)
    login.mutate(form)
  }

  return (
    <ModalView title="Login">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: 400 }}
        showsHorizontalScrollIndicator={false}
      >
        <View className="gap-1">
          <View>
            <FormInput
              autoCapitalize="none"
              autoComplete="email"
              label="Email"
              value={form.email}
              keyboardType="email-address"
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              error={login.error?.data?.zodError?.fieldErrors.email}
            />
          </View>
          <View>
            <FormInput
              secureTextEntry
              label="Password"
              value={form.password}
              onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
              error={login.error?.data?.zodError?.fieldErrors.password}
            />
          </View>
          <View>
            <Button isLoading={login.isLoading} disabled={login.isLoading} onPress={handleLogin}>
              Login
            </Button>
          </View>
          {login.error?.data?.formError && (
            <View>
              <FormError error={login.error.data.formError} />
            </View>
          )}
        </View>
        <View className="flex flex-row items-center justify-center py-3">
          <View className="mr-3 h-px flex-1 bg-gray-100 dark:bg-gray-600" />
          <Text className="opacity-60">or</Text>
          <View className="ml-3 h-px flex-1 bg-gray-100 dark:bg-gray-600" />
        </View>
        <View className="gap-2">
          <Link href="/register" asChild replace>
            <Button variant="outline">Register</Button>
          </Link>
        </View>
      </ScrollView>
    </ModalView>
  )
}
