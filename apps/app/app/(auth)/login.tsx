import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import * as React from "react"
import { KeyboardAvoidingView, ScrollView, View } from "react-native"
import { Button } from "../../components/Button"
import { FormInput } from "../../components/FormInput"
import { Heading } from "../../components/Heading"
import { Text } from "../../components/Text"

import { api, AUTH_TOKEN } from "../../lib/utils/api"

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
  const registerTempAccount = api.auth.registerTempAccount.useMutation({
    onSuccess: async (data) => {
      await AsyncStorage.setItem(AUTH_TOKEN, data.token)
      queryClient.auth.me.setData(undefined, data.user)
      router.replace("/")
    },
  })
  const [email, setEmail] = React.useState("jack@noquarter.co")
  const [password, setPassword] = React.useState("password")
  return (
    <KeyboardAvoidingView>
      <ScrollView className="h-full space-y-3 px-4 pt-16">
        <Heading className="text-3xl">Login</Heading>
        <View>
          <FormInput label="Email" value={email} onChangeText={setEmail} />
        </View>
        <View>
          <FormInput secureTextEntry label="Password" value={password} onChangeText={setPassword} />
        </View>
        <View>
          <Button disabled={login.isLoading || registerTempAccount.isLoading} onPress={() => login.mutate({ email, password })}>
            {login.isLoading ? "Logging in..." : "Login"}
          </Button>
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
            onPress={() => registerTempAccount.mutate()}
          >
            {registerTempAccount.isLoading ? "Creating account..." : "Create a temporary account"}
          </Button>
          <Text className="text-center">This can be converted to a real account later on</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
