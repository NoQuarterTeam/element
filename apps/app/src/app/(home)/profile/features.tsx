import { Switch, View } from "react-native"

import colors from "@element/tailwind-config/src/colors"

import { ScreenView } from "~/components/ScreenView"
import { Text } from "~/components/Text"
import { useFeatures } from "~/lib/hooks/useFeatures"
import { useMe } from "~/lib/hooks/useMe"
import { api } from "~/lib/utils/api"

export default function Features() {
  const { features, toggle } = useFeatures()
  const utils = api.useUtils()
  const { me } = useMe()
  return (
    <ScreenView title="Features">
      <View>
        <View className="flex flex-row items-center justify-between p-4">
          <Text className="text-xl">Habits</Text>
          <Switch
            disabled={!!!me?.stripeSubscriptionId}
            trackColor={{ true: colors.primary[600] }}
            value={features.includes("habits")}
            onValueChange={() => {
              toggle("habits")
              utils.habit.progressToday.refetch()
              utils.habit.allByDate.refetch()
            }}
          />
        </View>
        {!!!me?.stripeSubscriptionId && <Text className="text-sm opacity-70">You must be subscribed to access this feature</Text>}
      </View>
    </ScreenView>
  )
}
