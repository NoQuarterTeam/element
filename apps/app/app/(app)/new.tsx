import { Link } from "expo-router"
import { View, Text } from "react-native"
import { StatusBar } from "expo-status-bar"

export default function NewTask() {
  return (
    <View className="flex-grow px-4">
      <Link href="/" className="p-2">
        Back
      </Link>
      <Text className="text-3xl font-extrabold">New Task</Text>
      <StatusBar style="light" />
    </View>
  )
}
