import { ScrollView } from "react-native"
import { type AllRoutes, useGlobalSearchParams, useRouter } from "expo-router"

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
      if (!redirect) return router.back()
      router.navigate({ pathname: redirect as AllRoutes, params: { ...params, elementId: data.id } })
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
