import { ModalView } from "../../../components/ModalView"

import { ElementForm } from "../../../components/ElementForm"
import { api } from "../../../lib/utils/api"
import { useRouter } from "expo-router"

export default function NewElement() {
  const utils = api.useUtils()
  const router = useRouter()
  const { mutate, isLoading } = api.element.create.useMutation({
    onSuccess: () => {
      void utils.element.all.refetch()
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace("/")
      }
    },
  })
  return (
    <ModalView title="New Element">
      <ElementForm onCreate={mutate} isLoading={isLoading} />
    </ModalView>
  )
}
