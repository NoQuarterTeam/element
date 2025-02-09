import { useGlobalSearchParams, useRouter } from "expo-router"
import { ScrollView } from "react-native"

import { ElementForm } from "~/components/ElementForm"
import { ModalView } from "~/components/ModalView"
import { api } from "~/lib/utils/api"

export default function CreateElement() {
  const utils = api.useUtils()

  const router = useRouter()
  const { redirect, ...params } = useGlobalSearchParams()

  const { mutate, isLoading, error } = api.element.create.useMutation({
    onSuccess: async (data) => {
      void utils.element.grouped.refetch()
      await utils.element.all.refetch()
      router.back()
      router.setParams({ ...params, elementId: data.id })
    },
  })

  return (
    <ModalView title="Create element">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <ElementForm error={error?.data} isLoading={isLoading} onCreate={mutate} />
      </ScrollView>
    </ModalView>
  )
}
