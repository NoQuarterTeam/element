import * as React from "react"
import { ActivityIndicator, ScrollView, TouchableOpacity, useColorScheme, View } from "react-native"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import * as Progress from "react-native-progress"
import dayjs from "dayjs"

import { merge, useDisclosure } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { inputClassName } from "~/components/Input"
import { ScreenView } from "~/components/ScreenView"
import { Text } from "~/components/Text"
import { api } from "~/lib/utils/api"

export default function HabitStat() {
  const [startDate, setStartDate] = React.useState(dayjs().subtract(1, "months").toDate())
  const { data, isLoading } = api.habit.stats.useQuery({ startDate }, { keepPreviousData: true })
  const isDark = useColorScheme() === "dark"
  const dateProps = useDisclosure()

  const dayWithMostEntriesAndCount = data?.daysOfWeekStats && Object.entries(data.daysOfWeekStats).sort((a, b) => b[1] - a[1])[0]

  return (
    <ScreenView title="Stats">
      <View className="flex flex-row items-center space-x-4 py-1">
        <Text className="text-sm">Start date</Text>
        <View className="flex-1">
          <TouchableOpacity onPress={dateProps.onOpen} className={merge(inputClassName, "py-2")}>
            <Text className="text-center text-sm">{dayjs(startDate).format("DD/MM/YYYY")}</Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={dateProps.isOpen}
          date={startDate}
          onConfirm={(d) => {
            setStartDate(d)
            dateProps.onClose()
          }}
          onCancel={dateProps.onClose}
        />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !data ? (
          <View className="flex items-center justify-center pt-4">
            <ActivityIndicator />
          </View>
        ) : !data ? (
          <View className="flex items-center justify-center pt-4">
            <Text>Error loading stats</Text>
          </View>
        ) : (
          <View className="space-y-2">
            {data?.habits?.map((habit) => {
              const totalDays = dayjs().diff(startDate, "days")
              return (
                <View key={habit.id} className="flex flex-row items-center justify-between py-1">
                  <View className="flex-1">
                    <Text className="font-label text-lg">{habit.name}</Text>
                    <Text className="text-xs opacity-70">
                      {habit._count.entries} entries / {totalDays} days
                    </Text>
                  </View>

                  <View className="relative flex-1">
                    <Progress.Bar
                      progress={habit._count.entries / totalDays}
                      height={40}
                      width={null}
                      color={colors.primary.DEFAULT}
                      unfilledColor={isDark ? colors.gray[700] : colors.gray[75]}
                      borderWidth={0}
                    />
                    <View className="absolute bottom-0 right-0 top-0 flex items-center justify-center">
                      <Text className="px-2 text-sm">{Math.round((habit._count.entries / totalDays) * 100)}%</Text>
                    </View>
                  </View>
                </View>
              )
            })}

            <View className="space-y-2 py-4">
              <View>
                <Text className="text-lg">Breakdown by day</Text>
                <Text className="text-xs opacity-70">What are your most effective days?</Text>
              </View>
              <View className="flex space-y-2">
                {dayWithMostEntriesAndCount &&
                  Array.from({ length: 7 }).map((_, i) => {
                    const progress = (data.daysOfWeekStats[`${i}`] || 0) / (dayWithMostEntriesAndCount[1] || 1)
                    return (
                      <View key={i} className="flex flex-row items-center space-x-3">
                        <View className="w-[40px]">
                          <Text className="flex-shrink-0">{dayjs().day(i).format("ddd")}</Text>
                        </View>
                        <View className="relative flex-1">
                          <Progress.Bar
                            progress={progress}
                            height={20}
                            width={null}
                            color={colors.primary.DEFAULT}
                            unfilledColor={isDark ? colors.gray[700] : colors.gray[75]}
                            borderWidth={0}
                          />
                          <View className="absolute bottom-0 left-0 top-0 flex items-center justify-center">
                            <Text className="px-2 text-xs">{data.daysOfWeekStats[`${i}`]} entries</Text>
                          </View>
                        </View>
                      </View>
                    )
                  })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenView>
  )
}
