import { ActivityIndicator, FlatList, TouchableOpacity, View } from "react-native"
import { useGlobalSearchParams, useRouter } from "expo-router"

import { join } from "@element/shared"

import { ModalView } from "../../../../../components/ModalView"
import { Text } from "../../../../../components/Text"
import { api, type RouterOutputs } from "../../../../../lib/utils/api"

export default function ElementsDetailMove() {
  const { elementId: id, parentId } = useGlobalSearchParams()

  const { data, isLoading } = api.element.grouped.useQuery()
  const router = useRouter()

  const utils = api.useUtils()
  const { mutate } = api.element.update.useMutation({
    onSuccess: () => {
      void utils.element.grouped.refetch()
      if (router.canGoBack()) return router.back()
      void router.replace("/elements")
    },
  })
  return (
    <ModalView title="Move element to">
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
          ListHeaderComponent={
            parentId
              ? () => (
                  <TouchableOpacity
                    onPress={() => mutate({ id: id as string, parentId: null })}
                    activeOpacity={0.7}
                    className={join(
                      "border-gray-75 flex w-full flex-row items-center space-x-2 border-b pb-2 dark:border-gray-700",
                      id === null && "opacity-40",
                    )}
                  >
                    <Text className="text-lg">No parent</Text>
                  </TouchableOpacity>
                )
              : undefined
          }
          renderItem={({ item }) => <ElementItem element={item} onPress={(parentId) => mutate({ id: id as string, parentId })} />}
        />
      )}
    </ModalView>
  )
}

function ElementItem({
  element,
  onPress,
}: {
  element: RouterOutputs["element"]["grouped"][number]
  onPress: (id: string) => void
}) {
  const { elementId: id, parentId } = useGlobalSearchParams()
  return (
    <View>
      <TouchableOpacity
        disabled={element.id === (id as string) || element.id === parentId}
        onPress={() => onPress(element.id)}
        activeOpacity={0.7}
        className={join(
          "flex flex-row items-center space-x-2 py-1",
          (element.id === id || element.id === parentId) && "opacity-40",
        )}
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
            <ElementItem onPress={onPress} key={child.id} element={child} />
          ))}
        </View>
      )}
    </View>
  )
}
