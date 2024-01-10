import { ActivityIndicator, ScrollView, View } from "react-native"
import { useGlobalSearchParams, useRouter } from "expo-router"

import { ElementForm } from "../../../../../components/ElementForm"
import { ModalView } from "../../../../../components/ModalView"
import { Text } from "../../../../../components/Text"
import { useTimelineDays } from "../../../../../lib/hooks/useTimelineDays"
import { api } from "../../../../../lib/utils/api"

export default function ElementDetail() {
  const utils = api.useUtils()
  const router = useRouter()
  const { elementId: id } = useGlobalSearchParams()

  const { data, isLoading, error } = api.element.byId.useQuery({ id: String(id) }, { enabled: !!id })

  const { daysBack, daysForward } = useTimelineDays()

  const { mutate, isLoading: updateLoading } = api.element.update.useMutation({
    onSuccess: () => {
      void utils.element.byId.refetch({ id: String(id) })
      void utils.element.all.refetch()
      void utils.element.grouped.refetch()
      void utils.task.timeline.refetch({ daysBack, daysForward })
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace("/")
      }
    },
  })

  return (
    <ModalView title="Edit Element">
      {isLoading ? (
        <View className="flex items-center justify-center pt-4">
          <ActivityIndicator />
        </View>
      ) : !data ? (
        <View className="pt-4">
          <Text className="text-center">Element not found</Text>
        </View>
      ) : (
        <ScrollView
          className="space-y-4"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ minHeight: "100%", paddingBottom: 400 }}
          showsVerticalScrollIndicator={false}
        >
          <ElementForm error={error?.data} element={data} onUpdate={mutate} isLoading={updateLoading} />
        </ScrollView>
      )}
    </ModalView>
  )
}
