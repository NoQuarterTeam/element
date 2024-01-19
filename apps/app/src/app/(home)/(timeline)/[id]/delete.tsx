import { ScrollView } from "react-native"
import { useGlobalSearchParams, useRouter } from "expo-router"

import { Button } from "~/components/Button"
import { ModalView } from "~/components/ModalView"
import { Text } from "~/components/Text"
import { useTimelineDays } from "~/lib/hooks/useTimeline"
import { api } from "~/lib/utils/api"

export default function DeleteTask() {
  const router = useRouter()
  const utils = api.useUtils()
  const { daysBack, daysForward } = useTimelineDays()

  const { id } = useGlobalSearchParams()

  const onSuccess = () => {
    void utils.task.timeline.refetch({ daysBack, daysForward })
    router.push("/")
  }
  const deleteTask = api.task.delete.useMutation({ onSuccess })
  const deleteFutureTasks = api.task.delete.useMutation({ onSuccess })
  const handleDelete = (shouldDeleteFuture: boolean) => {
    if (!id) return router.push("/")
    if (!shouldDeleteFuture) return deleteTask.mutate({ id: id as string })
    return deleteFutureTasks.mutate({ id: id as string, shouldDeleteFuture })
  }

  return (
    <ModalView title="Delete task">
      <ScrollView className="flex-1 space-y-2">
        <Text>Do you want to only delete this task or all future tasks as well?</Text>
        <Button
          isLoading={deleteTask.isLoading}
          disabled={deleteTask.isLoading || deleteFutureTasks.isLoading}
          onPress={() => handleDelete(false)}
        >
          Delete this task
        </Button>
        <Button
          isLoading={deleteFutureTasks.isLoading}
          disabled={deleteTask.isLoading || deleteFutureTasks.isLoading}
          variant="destructive"
          onPress={() => handleDelete(true)}
        >
          Delete future tasks as well
        </Button>
      </ScrollView>
    </ModalView>
  )
}
