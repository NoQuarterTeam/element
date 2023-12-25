import { ModalView } from "../../../components/ModalView"
import { Text } from "../../../components/Text"
import { RouterOutputs, api } from "../../../lib/utils/api"
import { Spinner } from "../../../components/Spinner"
import { FlatList, TouchableOpacity, View } from "react-native"
import { formatDuration, join, safeReadableColor } from "@element/shared"
import { Icon } from "../../../components/Icon"
import { CheckCircle, Circle } from "lucide-react-native"

export default function Backlog() {
  const { data, isLoading } = api.task.backlog.useQuery()

  return (
    <ModalView title="Backlog">
      {isLoading ? (
        <View className="flex flex-row items-end justify-center pt-6">
          <Spinner />
        </View>
      ) : (
        <FlatList
          data={data}
          // refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefetch} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 130, paddingTop: 10 }}
          renderItem={({ item }) => <TaskItem task={item} />}
        />
      )}
    </ModalView>
  )
}

function TaskItem({ task }: { task: RouterOutputs["task"]["backlog"][number] }) {
  return (
    <TouchableOpacity activeOpacity={0.8} className="mb-px mt-1 bg-white dark:bg-black">
      <View
        className={join(
          "overflow-hidden rounded-md border border-gray-100 bg-white dark:border-gray-600 dark:bg-black",
          task.isComplete && "opacity-60",
        )}
      >
        <View className="flex flex-row space-x-2 p-3">
          <TouchableOpacity className="flex-shrink-0">
            {task.isComplete ? <Icon icon={CheckCircle} size={24} color="primary" /> : <Icon icon={Circle} size={24} />}
          </TouchableOpacity>

          <View className="flex-1 flex-row justify-between">
            <Text
              className="text-md flex flex-1 pt-0.5"
              style={{ textDecorationLine: task.isComplete ? "line-through" : undefined }}
            >
              {task.name}
            </Text>
            {!task.isComplete && (
              <View className="flex flex-shrink-0 flex-row items-center space-x-2">
                {task.startTime ? <Text className="text-xs">{task.startTime}</Text> : null}
                {task.durationHours || task.durationMinutes ? (
                  <Text className="text-xs">{formatDuration(task.durationHours, task.durationMinutes)}</Text>
                ) : null}
              </View>
            )}
          </View>
        </View>
        <View style={{ backgroundColor: task.element.color }} className="rounded-b-sm p-1">
          <Text style={{ color: safeReadableColor(task.element.color) }} className="text-xs">
            {task.element.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
