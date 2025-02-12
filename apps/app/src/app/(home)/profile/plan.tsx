import dayjs from "dayjs"
import { ActivityIndicator, ScrollView, View } from "react-native"

import { MAX_FREE_ELEMENTS, MAX_FREE_TASKS, join } from "@element/shared"

import { ScreenView } from "~/components/ScreenView"
import { Text } from "~/components/Text"
import { api } from "~/lib/utils/api"

export default function Plan() {
  const { data, isLoading } = api.user.myPlan.useQuery(undefined, { cacheTime: 30000 })
  const discountedPlanAmount = data?.subscription?.discountPercent ? 4 - (4 * 100) / data.subscription.discountPercent : null
  return (
    <ScreenView title="Plan">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        {isLoading ? (
          <View className="flex w-full items-center justify-center pt-4">
            <ActivityIndicator />
          </View>
        ) : !data ? null : data.subscription ? (
          <View className="gap-3">
            <Text className="text-lg">
              You are currently on the <Text className="font-heading">Pro</Text> plan
            </Text>
            {discountedPlanAmount || discountedPlanAmount === 0 ? (
              <Text className="text-sm">
                A {data.subscription.discountPercent}% discount is applied to your subscription, you pay €{discountedPlanAmount}{" "}
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
          <View className="mt-2 gap-5">
            <Text className="text-xl">
              You are currently on the <Text className="font-heading">Personal</Text> plan
            </Text>
            <View>
              <Text className="mb-1 text-lg">Current usage</Text>
              <View className="flex flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-lg">Tasks</Text>
                  <View className="flex flex-row">
                    <Text
                      className={join(
                        "text-4xl",
                        (data.taskCount || 0) >= MAX_FREE_TASKS
                          ? "text-red-500"
                          : (data.taskCount || 0) > MAX_FREE_TASKS * 0.75
                            ? "text-primary-500"
                            : undefined,
                      )}
                    >
                      {data.taskCount}{" "}
                    </Text>
                    <Text className="text-sm font-thin opacity-70">/ {MAX_FREE_TASKS}</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-lg">Elements</Text>
                  <View className="flex flex-row">
                    <Text
                      className={join(
                        "text-4xl",
                        (data.elementCount || 0) >= MAX_FREE_ELEMENTS
                          ? "text-red-500"
                          : (data.elementCount || 0) > MAX_FREE_ELEMENTS * 0.75
                            ? "text-primary-500"
                            : undefined,
                      )}
                    >
                      {data.elementCount}{" "}
                    </Text>
                    <Text className="text-sm font-thin opacity-70">/ 5</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenView>
  )
}
