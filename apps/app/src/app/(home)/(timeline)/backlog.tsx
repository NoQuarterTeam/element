import { ModalView } from "../../../components/ModalView"
import { Text } from "../../../components/Text"
import { api } from "../../../lib/utils/api"
import { Spinner } from "../../../components/Spinner"
import { View } from "react-native"

export default function Backlog() {
  const { data, isLoading } = api.task.backlog.useQuery()

  return (
    <ModalView title="Backlog">
      {isLoading ? (
        <View className="flex flex-row items-end justify-center pt-6">
          <Spinner />
        </View>
      ) : (
        data?.map((task) => <Text key={task.id}>{task.name}</Text>)
      )}
    </ModalView>
  )
}
