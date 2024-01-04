import { FlatList, TouchableOpacity, View } from "react-native"
import { Link } from "expo-router"
import { Plus } from "lucide-react-native"

import { Icon } from "../../../../components/Icon"
import { ModalView } from "../../../../components/ModalView"
import { Spinner } from "../../../../components/Spinner"
import { Text } from "../../../../components/Text"
import { api, type RouterOutputs } from "../../../../lib/utils/api"

export default function Elements() {
  const { data, isLoading } = api.element.all.useQuery()

  return (
    <ModalView title="Elements">
      <View className="relative flex-1">
        {isLoading ? (
          <View className="flex items-center justify-center pt-4">
            <Spinner />
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
        <Link href={`/elements/create`} asChild>
          <TouchableOpacity className="bg-primary-500/90 sq-14 absolute bottom-6 right-4 flex items-center justify-center rounded-full">
            <Icon icon={Plus} size={24} color="black" />
          </TouchableOpacity>
        </Link>
      </View>
    </ModalView>
  )
}

function ElementItem({ element }: { element: RouterOutputs["element"]["all"][number] }) {
  return (
    <Link href={`/elements/${element.id}`} asChild>
      <TouchableOpacity activeOpacity={0.7} className="flex flex-row items-center space-x-2 py-1">
        <View className="sq-4 rounded-full" style={{ backgroundColor: element.color }} />
        <Text className="text-lg">{element.name}</Text>
      </TouchableOpacity>
    </Link>
  )
}
