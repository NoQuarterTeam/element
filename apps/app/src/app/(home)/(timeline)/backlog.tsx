import dayjs from "dayjs"
import * as Haptics from "expo-haptics"
import { useFocusEffect, useRouter } from "expo-router"
import { Circle } from "lucide-react-native"
import { ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, useColorScheme, View } from "react-native"

import { formatDuration, safeReadableColor } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { useActionSheet } from "@expo/react-native-action-sheet"
import { ModalView } from "../../../components/ModalView"
import { Text } from "../../../components/Text"
import { useTimelineDays } from "../../../lib/hooks/useTimelineDays"
import { api, type RouterOutputs } from "../../../lib/utils/api"

export default function Backlog() {
  const { data, isLoading, refetch } = api.task.backlog.useQuery()

  useFocusEffect(() => {
    // when coming back to this screen, refetch the data (task detail e.g)
    refetch()
  })
  return (
    <ModalView title="Backlog">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        {isLoading ? (
          <View className="flex flex-row items-end justify-center pt-6">
            <ActivityIndicator />
          </View>
        ) : !data ? (
          <View className="flex flex-row items-end justify-center pt-6">
            <Text>Error getting backlog</Text>
          </View>
        ) : data.length === 0 ? (
          <View className="flex flex-row items-end justify-center pt-6">
            <Text>Backlog empty</Text>
          </View>
        ) : (
          data.map((item) => (
            <View key={item.id} className="pb-2">
              <TaskItem task={item} />
            </View>
          ))
        )}
      </ScrollView>
    </ModalView>
  )
}

function TaskItem({ task }: { task: RouterOutputs["task"]["backlog"][number] }) {
  const router = useRouter()

  const { daysBack, daysForward } = useTimelineDays()
  const utils = api.useUtils()
  const { mutate } = api.task.delete.useMutation({
    onSuccess: () => {
      void utils.task.backlog.invalidate()
    },
  })

  const { mutate: updateTask } = api.task.update.useMutation({
    onSuccess: () => {
      void utils.task.timeline.refetch({ daysBack, daysForward })
      void utils.task.backlog.invalidate()
    },
  })

  const { showActionSheetWithOptions } = useActionSheet()
  const handleOpenMenu = () => {
    const options = ["Cancel", "Add to timeline", "Delete"]
    const cancelButtonIndex = 0
    const destructiveButtonIndex = 2

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    showActionSheetWithOptions({ options, cancelButtonIndex, destructiveButtonIndex }, (selectedIndex) => {
      switch (selectedIndex) {
        case cancelButtonIndex:
          // Canceled
          break
        case 1:
          // Add to timeline
          updateTask({ id: task.id, date: dayjs().format("YYYY-MM-DD") })
          break
        case destructiveButtonIndex:
          mutate({ id: task.id })
          break
      }
    })
  }

  const isDark = useColorScheme() === "dark"
  return (
    <View className="rounded border border-gray-100 bg-white dark:border-gray-600 dark:bg-black">
      <View className="flex flex-1 flex-row space-x-2 p-3">
        <TouchableOpacity
          onLongPress={handleOpenMenu}
          onPress={() => router.push({ pathname: "index", params: { id: task.id } })}
          className="flex-1 flex-row justify-between"
        >
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
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => updateTask({ id: task.id, isComplete: true, date: dayjs().format("YYYY-MM-DD") })}
          className="flex-shrink-0"
        >
          <Circle size={24} color={isDark ? colors.gray[700] : colors.gray[100]} />
        </TouchableOpacity>
      </View>
      <View style={{ backgroundColor: task.element.color }} className="rounded-b-sm p-1">
        <Text style={{ color: safeReadableColor(task.element.color) }} className="text-xs">
          {task.element.name}
        </Text>
      </View>
    </View>
  )
}
