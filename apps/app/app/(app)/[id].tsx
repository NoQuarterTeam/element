import { Text } from "react-native"
import { useSearchParams } from "expo-router"
import { Modal } from "../../components/Modal"
import { api } from "../../lib/utils/api"

export default function TaskDetail() {
  const { id } = useSearchParams()

  const { data } = api.task.byId.useQuery(id as string)

  return (
    <Modal title={data?.name || ""}>
      <Text>{data?.description}</Text>
    </Modal>
  )
}
