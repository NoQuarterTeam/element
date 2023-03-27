import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import * as React from "react"
import { KeyboardAvoidingView, ScrollView, View } from "react-native"
import { Button } from "../../src/components/Button"
import { FormError } from "../../src/components/FormError"
import { FormInput } from "../../src/components/FormInput"
import { Heading } from "../../src/components/Heading"
import { Text } from "../../src/components/Text"

import { api, AUTH_TOKEN } from "../../src/lib/utils/api"

export default function Login() {
  const queryClient = api.useContext()
  const router = useRouter()
  const login = api.auth.login.useMutation({
    onSuccess: async (data) => {
      await AsyncStorage.setItem(AUTH_TOKEN, data.token)
      queryClient.auth.me.setData(undefined, data.user)
      router.replace("/")
    },
  })
  const handleLogin = async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN)
    login.mutate({ email, password })
  }
  const registerTempAccount = api.auth.registerTempAccount.useMutation({
    onSuccess: async (data) => {
      await AsyncStorage.setItem(AUTH_TOKEN, data.token)
      queryClient.auth.me.setData(undefined, data.user)
      router.replace("/")
    },
  })
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  return (
    <KeyboardAvoidingView>
      <ScrollView className="h-full space-y-3 px-4 pt-16">
        <Heading className="text-4xl">Login</Heading>
        <View>
          <FormInput label="Email" value={email} onChangeText={setEmail} error={login.error?.data?.zodError?.fieldErrors.email} />
        </View>
        <View>
          <FormInput
            secureTextEntry
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={login.error?.data?.zodError?.fieldErrors.password}
          />
        </View>
        <View className="space-y-1">
          <View>
            <Button isLoading={login.isLoading} disabled={login.isLoading || registerTempAccount.isLoading} onPress={handleLogin}>
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
          <View className="mr-3 h-px flex-1 bg-gray-100 dark:bg-gray-600"></View>
          <Text className="opacity-60">or</Text>
          <View className="ml-3 h-px flex-1 bg-gray-100 dark:bg-gray-600"></View>
        </View>
        <View className="space-y-2">
          <Button
            variant="outline"
            disabled={registerTempAccount.isLoading || login.isLoading}
            isLoading={registerTempAccount.isLoading}
            onPress={() => registerTempAccount.mutate()}
          >
            Create a temporary account
          </Button>
          <Text className="text-center">This can be converted to a real account later on</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
