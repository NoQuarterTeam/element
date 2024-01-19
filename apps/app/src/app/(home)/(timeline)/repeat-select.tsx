import { ScrollView, TouchableOpacity } from "react-native"
import { useGlobalSearchParams, useRouter } from "expo-router"

import { type TaskRepeat } from "@element/database/types"
import { join } from "@element/shared"

import { ModalView } from "~/components/ModalView"
import { Text } from "~/components/Text"
import { TaskRepeatOptions } from "~/lib/taskRepeat"

export default function RepeatSelect() {
  const { repeat, redirect, ...params } = useGlobalSearchParams()
  const router = useRouter()

  const handleTo = (repeat: TaskRepeat) => {
    if (!redirect) return router.back()
    router.push({ params: { ...params, repeat }, pathname: redirect as string })
  }

  return (
    <ModalView title="What period?">
      <ScrollView className="flex-1 pt-2">
        {Object.entries(TaskRepeatOptions).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            className="border-b border-gray-100 dark:border-gray-700"
            onPress={() => handleTo(key as TaskRepeat)}
          >
            <Text className={join("px-4 py-3 text-lg opacity-80", repeat === key && "font-label")}>{value}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ModalView>
  )
}
