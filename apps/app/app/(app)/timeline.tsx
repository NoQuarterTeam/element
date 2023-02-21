import { FlashList } from "@shopify/flash-list"
import { Link } from "expo-router"
import { Text, View } from "react-native"
import { api } from "../../lib/utils/api"

export default function Timeline() {
  const { data: taskData } = api.task.allTasks.useQuery()
  return (
    <View className="flex rounded-lg px-6 pt-20">
      <Link href="/">Back</Link>
      <Text className="text-3xl font-extrabold">Tasks</Text>
      <View className="flex-grow">
        <View className="min-h-[500px]">
          <FlashList
            estimatedItemSize={30}
            data={taskData}
            renderItem={({ item }) => <Text className="py-4">{item.name}</Text>}
          />
        </View>
      </View>
    </View>
  )
}
