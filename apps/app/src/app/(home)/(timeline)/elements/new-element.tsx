import { ModalView } from "../../../../components/ModalView"

import { ElementForm } from "../../../../components/ElementForm"
import { api } from "../../../../lib/utils/api"
import { useRouter } from "expo-router"
import { ScrollView } from "react-native"
import { useTimelineDays } from "../../../../lib/hooks/useTimelineDays"

export default function NewElement() {
  const utils = api.useUtils()
  const router = useRouter()
  const { daysBack, daysForward } = useTimelineDays()
  const { mutate, isLoading } = api.element.create.useMutation({
    onSuccess: () => {
      void utils.element.all.refetch()
      void utils.task.timeline.refetch({ daysBack, daysForward })
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace("/")
      }
    },
  })
  return (
    <ModalView title="New Element">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 400 }}
        showsVerticalScrollIndicator={false}
      >
        <ElementForm onCreate={mutate} isLoading={isLoading} />
      </ScrollView>
    </ModalView>
  )
}
