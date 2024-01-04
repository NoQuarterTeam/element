import { ScrollView } from "react-native"
import { useGlobalSearchParams, useRouter } from "expo-router"

import { ElementForm } from "../../../../components/ElementForm"
import { ModalView } from "../../../../components/ModalView"
import { api } from "../../../../lib/utils/api"

export default function CreateElement() {
  const utils = api.useUtils()

  const router = useRouter()
  const { redirect, ...params } = useGlobalSearchParams()

  const { mutate, isLoading, error } = api.element.create.useMutation({
    onSuccess: async (data) => {
      await utils.element.all.refetch()
      if (!redirect) return router.back()
      router.push({ pathname: redirect as string, params: { ...params, elementId: data.id } })
    },
  })

  return (
    <ModalView title="Create element">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <ElementForm error={error?.data} isLoading={isLoading} onCreate={mutate} />
      </ScrollView>
    </ModalView>
  )
}
