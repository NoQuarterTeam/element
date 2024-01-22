import { ActivityIndicator, FlatList, TouchableOpacity, View } from "react-native"
import { useActionSheet } from "@expo/react-native-action-sheet"
import * as Haptics from "expo-haptics"
import { Link, useRouter } from "expo-router"
import { Plus } from "lucide-react-native"

import { Icon } from "~/components/Icon"
import { ModalView } from "~/components/ModalView"
import { Text } from "~/components/Text"
import { useTimelineDays } from "~/lib/hooks/useTimeline"
import { api, type RouterOutputs } from "~/lib/utils/api"

export default function Elements() {
  const { data, isLoading } = api.element.grouped.useQuery()

  return (
    <ModalView title="Elements">
      <View className="relative flex-1">
        {isLoading ? (
          <View className="flex items-center justify-center pt-4">
            <ActivityIndicator />
          </View>
        ) : !data ? null : (
          <FlatList
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
            data={data}
            ItemSeparatorComponent={() => <View className="h-1" />}
            ListEmptyComponent={() => (
              <View className="pt-4">
                <Text className="text-center">No elements yet</Text>
              </View>
            )}
            renderItem={({ item }) => <ElementItem element={item} />}
          />
        )}
        <View pointerEvents="box-none" className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
          <Link href={`/elements/create`} asChild>
            <TouchableOpacity className="bg-primary-500/90 sq-14 flex items-center justify-center rounded-full">
              <Icon icon={Plus} size={24} color="black" />
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ModalView>
  )
}

function ElementItem({ element }: { element: RouterOutputs["element"]["grouped"][number] }) {
  const router = useRouter()
  const utils = api.useUtils()

  const { daysBack, daysForward } = useTimelineDays()
  const { mutate } = api.element.update.useMutation({
    onSuccess: () => {
      void utils.element.all.refetch()
      void utils.element.grouped.refetch()
      void utils.task.timeline.refetch({ daysBack, daysForward })
    },
  })
  const { showActionSheetWithOptions } = useActionSheet()
  const handleOpenMenu = () => {
    const options = ["Cancel", "Edit", "Move", "Archive"]
    const cancelButtonIndex = 0
    const destructiveButtonIndex = 3

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    showActionSheetWithOptions({ options, cancelButtonIndex, destructiveButtonIndex }, (selectedIndex) => {
      switch (selectedIndex) {
        case cancelButtonIndex:
          // Canceled
          break
        case 1:
          // Edit
          router.push(`/elements/${element.id}/`)
          break
        case 2:
          // Move
          router.push(`/elements/${element.id}/move?parentId=${element.parentId || ""}`)
          break
        case destructiveButtonIndex:
          // Archive
          mutate({ id: element.id, archivedAt: new Date() })
          break
      }
    })
  }
  return (
    <View>
      <TouchableOpacity
        onPress={() => router.push(`/elements/${element.id}/`)}
        onLongPress={handleOpenMenu}
        activeOpacity={0.7}
        className="flex flex-row items-center space-x-2 py-1"
      >
        <View
          className="sq-5 rounded-full border border-gray-300 dark:border-gray-700"
          style={{ backgroundColor: element.color }}
        />
        <Text className="text-lg">{element.name}</Text>
      </TouchableOpacity>

      {element.children && element.children.length > 0 && (
        <View className="pl-4">
          {element.children.map((child) => (
            <ElementItem key={child.id} element={child} />
          ))}
        </View>
      )}
    </View>
  )
}
