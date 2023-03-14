import AsyncStorage from "@react-native-async-storage/async-storage"
import { Link } from "expo-router"
import { Text, View } from "react-native"
import { Button } from "../../components/Button"
import { api, AUTH_TOKEN } from "../../lib/utils/api"

export default function Profile() {
  const { data } = api.auth.me.useQuery()
  const queryClient = api.useContext()
  const handleLogout = async () => {
    await AsyncStorage.setItem(AUTH_TOKEN, "")
    queryClient.auth.me.setData(undefined, null)
  }

  return (
    <View className="flex-grow px-4">
      <Link href="/" className="p-2">
        Back
      </Link>
      {data && (
        <View className="space-y-4">
          <Text className="text-3xl font-extrabold">Hey, {data.firstName}</Text>
          <Button onPress={handleLogout}>Logout</Button>
        </View>
      )}
    </View>
  )
}
