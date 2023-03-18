import AsyncStorage from "@react-native-async-storage/async-storage"
import { useQueryClient } from "@tanstack/react-query"
import { Text, View } from "react-native"
import { Button } from "../../components/Button"

import { ScreenView } from "../../components/ScreenView"
import { api, AUTH_TOKEN } from "../../lib/utils/api"

export default function Profile() {
  const { data } = api.auth.me.useQuery()
  const utils = api.useContext()
  const client = useQueryClient()

  const handleLogout = async () => {
    utils.auth.me.setData(undefined, null)
    await AsyncStorage.setItem(AUTH_TOKEN, "")
    client.clear()
  }

  return (
    <ScreenView title="Profile">
      {data && (
        <View className="space-y-4">
          <Text className="font-body text-3xl">Hey, {data.firstName}</Text>
          <Button onPress={handleLogout}>Logout</Button>
        </View>
      )}
    </ScreenView>
  )
}
