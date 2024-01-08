import * as React from "react"
import dayjs from "dayjs"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import * as Progress from "react-native-progress"
import { ScreenView } from "../../../components/ScreenView"
import { Text } from "../../../components/Text"
import { api } from "../../../lib/utils/api"
import { ActivityIndicator, ScrollView, TouchableOpacity, View, useColorScheme } from "react-native"
import colors from "@element/tailwind-config/src/colors"

import { merge, useDisclosure } from "@element/shared"
import { inputClassName } from "../../../components/Input"

export default function HabitStat() {
  const [startDate, setStartDate] = React.useState(dayjs().subtract(3, "months").toDate())
  const { data, isLoading } = api.habit.stats.useQuery({ startDate })
  const isDark = useColorScheme() === "dark"
  const dateProps = useDisclosure()
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
        {isLoading ? (
          <View className="flex items-center justify-center pt-4">
            <ActivityIndicator />
          </View>
        ) : !data ? (
          <View className="flex items-center justify-center pt-4">
            <Text>Error loading habits</Text>
          </View>
        ) : (
          <View className="space-y-2">
            {data.map((habit) => {
              const totalDays = dayjs().diff(startDate, "days")
              return (
                <View key={habit.id} className="flex flex-row items-center justify-between py-2">
                  <View className="flex-1">
                    <Text className="font-label text-lg">{habit.name}</Text>
                    <Text className="text-xs">
                      {habit._count.entries} entries / {totalDays} days
                    </Text>
                  </View>

                  <View className="relative flex-1">
                    <Progress.Bar
                      progress={Math.round((habit._count.entries / 90) * 100) / 100}
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
          </View>
        )}
      </ScrollView>
    </ScreenView>
  )
}
