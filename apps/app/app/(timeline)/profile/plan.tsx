import dayjs from "dayjs"
import { View } from "react-native"
import { ScreenView } from "../../../components/ScreenView"
import { Text } from "../../../components/Text"
import { MAX_FREE_TASKS, MAX_FREE_ELEMENTS, join } from "@element/shared"
import { api } from "../../../lib/utils/api"

export default function Plan() {
  const { data, isLoading } = api.auth.myPlan.useQuery()
  const discountedPlanAmount = data?.subscription?.discountPercent ? 4 - (4 * 100) / data.subscription.discountPercent : null
  return (
    <ScreenView title="Plan">
      {!data || isLoading ? null : data?.subscription ? (
        <View className="space-y-3">
          <Text className="text-lg">
            You are currently on the <Text className="font-heading">Pro</Text> plan
          </Text>
          {discountedPlanAmount || discountedPlanAmount === 0 ? (
            <Text className="text-sm">
              A {data?.subscription.discountPercent}% discount is applied to your subscription, you pay €{discountedPlanAmount}{" "}
              per month
            </Text>
          ) : null}
          {data.subscription.isCancelled ? (
            <Text className="text-sm">
              You have cancelled but still have access to Pro features until{" "}
              <Text className="font-heading">{dayjs.unix(data.subscription.endDate).format("DD/MM/YYYY")}</Text>
            </Text>
          ) : data.subscription.status === "active" && data.subscription.endDate ? (
            <Text className="text-sm">
              Your plan will renew on{" "}
              <Text className="font-heading">{dayjs.unix(data.subscription.endDate).format("DD/MM/YYYY")}</Text>
            </Text>
          ) : data.subscription.status === "past_due" || data.subscription.status === "unpaid" ? (
            <Text className="text-sm">Your plan requires payment</Text>
          ) : null}
        </View>
      ) : (
        <View className="space-y-3">
          <Text className="text-lg">
            You are currently on the <Text className="font-heading">Personal</Text> plan
          </Text>
          <Text className="text-sm">Current usage</Text>
          <View className="grid grid-cols-2 gap-4">
            <View>
              <Text className="text-sm">Tasks</Text>
              <View className="flex flex-row">
                <Text
                  className={join(
                    "text-2xl",
                    (data?.taskCount || 0) >= MAX_FREE_TASKS
                      ? "text-red-500"
                      : (data?.taskCount || 0) > MAX_FREE_TASKS * 0.75
                      ? "text-primary-500"
                      : undefined,
                  )}
                >
                  {data?.taskCount}{" "}
                </Text>
                <Text className="text-xs font-thin opacity-70">/ {MAX_FREE_TASKS}</Text>
              </View>
            </View>
            <View>
              <Text className="text-sm">Elements</Text>
              <View className="flex flex-row">
                <Text
                  className={join(
                    "text-2xl",
                    (data?.elementCount || 0) >= MAX_FREE_ELEMENTS
                      ? "text-red-500"
                      : (data?.elementCount || 0) > MAX_FREE_ELEMENTS * 0.75
                      ? "text-primary-500"
                      : undefined,
                  )}
                >
                  {data?.elementCount}
                </Text>{" "}
                <Text className="text-xs font-thin opacity-70">/ 5</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScreenView>
  )
}
