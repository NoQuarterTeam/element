import { ModalView } from "../../../components/ModalView"
import { Text } from "../../../components/Text"
import { RouterOutputs, api } from "../../../lib/utils/api"
import { Spinner } from "../../../components/Spinner"
import { FlatList, RefreshControl, TouchableOpacity, View } from "react-native"
import { formatDuration, join, safeReadableColor } from "@element/shared"
import { Icon } from "../../../components/Icon"
import { CheckCircle, Circle, Home, Trash } from "lucide-react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"

export default function Backlog() {
  const { data, isLoading, refetch } = api.task.backlog.useQuery()

  return (
    <ModalView title="Backlog">
      {isLoading ? (
        <View className="flex flex-row items-end justify-center pt-6">
          <Spinner />
        </View>
      ) : (
        <FlatList
          data={data}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View className="h-1" />}
          contentContainerStyle={{ paddingBottom: 130, paddingTop: 10 }}
          renderItem={({ item }) => <TaskItem task={item} />}
        />
      )}
    </ModalView>
  )
}

const buttonSize = 80

function TaskItem({ task }: { task: RouterOutputs["task"]["backlog"][number] }) {
  const translateX = useSharedValue(0)
  const offsetX = useSharedValue(0)
  // const height = useSharedValue(75)

  const gesture = Gesture.Pan()
    .onStart(() => {
      offsetX.value = translateX.value
    })
    .onChange((event) => {
      translateX.value = withSpring(Math.max(Math.min(offsetX.value + event.translationX, 0), -2 * buttonSize - 1), {
        velocity: event.velocityX,
        // damping: 100,
        // stiffness: 50,
        overshootClamping: true,
      })
    })
    .onEnd(() => {
      if (translateX.value > -2 * buttonSize) {
        translateX.value = withSpring(0)
      }
    })

  const utils = api.useUtils()
  const { mutate } = api.task.delete.useMutation({
    onMutate: () => {
      // height.value = withTiming(0)
    },
    onSuccess: () => {
      void utils.task.backlog.invalidate()
    },
  })

  const styles = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })
  return (
    <View className="relative">
      <View className="absolute right-0 top-0 flex h-full flex-row">
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ width: buttonSize }}
          className="flex h-full items-center justify-center rounded-l bg-gray-50 p-2 dark:bg-gray-800"
        >
          <Icon icon={Home} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => mutate({ id: task.id })}
          style={{ width: buttonSize }}
          className="flex h-full items-center justify-center rounded-r bg-red-500 p-2"
        >
          <Icon icon={Trash} color="white" size={20} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles]}>
        <GestureDetector gesture={gesture}>
          <TouchableOpacity
            activeOpacity={1}
            style={{ height: 75 }}
            className={join(
              "overflow-hidden rounded border border-gray-100 bg-white dark:border-gray-600 dark:bg-black",
              task.isComplete && "opacity-60",
            )}
          >
            <View className="flex flex-1 flex-row space-x-2 p-3">
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
          </TouchableOpacity>
        </GestureDetector>
      </Animated.View>
    </View>
  )
}
