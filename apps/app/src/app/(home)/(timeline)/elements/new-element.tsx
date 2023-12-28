import { ScrollView } from "react-native"
import { useRouter } from "expo-router"

import { ElementForm } from "../../../../components/ElementForm"
import { ModalView } from "../../../../components/ModalView"
import { useTimelineDays } from "../../../../lib/hooks/useTimelineDays"
import { api } from "../../../../lib/utils/api"

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
