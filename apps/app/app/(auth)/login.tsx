import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import * as React from "react"
import { View } from "react-native"
import { Button } from "../../components/Button"
import { FormInput } from "../../components/FormInput"
import { Heading } from "../../components/Heading"

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
  const [email, setEmail] = React.useState("jack@noquarter.co")
  const [password, setPassword] = React.useState("password")
  return (
    <View className="space-y-3 px-4 pt-16">
      <Heading className="text-3xl">Login</Heading>
      <View>
        <FormInput label="Email" value={email} onChangeText={setEmail} />
      </View>
      <View>
        <FormInput secureTextEntry label="Password" value={password} onChangeText={setPassword} />
      </View>
      <View>
        <Button disabled={login.isLoading} onPress={() => login.mutate({ email, password })}>
          {login.isLoading ? "logging in..." : "Login"}
        </Button>
      </View>
    </View>
  )
}
