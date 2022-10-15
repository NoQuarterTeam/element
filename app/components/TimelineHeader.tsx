import * as React from "react"
import * as c from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"

import { MONTH_NAMES } from "~/lib/helpers/timeline"
import { useFeatures } from "~/lib/hooks/useFeatures"
import { useTimelineDays } from "~/lib/hooks/useTimelineDays"
import { useMe } from "~/pages/_app"
import type { TimelineHabitResponse } from "~/pages/api.habits"
import type { DayWeather, WeatherData } from "~/pages/api.weather"

import { DAY_WIDTH } from "./Day"
import { Habits } from "./Habits"

export const HEADER_HEIGHT = 115

export const HEADER_HABIT_HEIGHT = 138

interface TimelineHeaderProps {
  isLoading: boolean
  days: string[]
  months: { month: number; year: number }[]
}
export const TimelineHeader = React.memo(_TimelineHeader)
function _TimelineHeader({ days, months, isLoading }: TimelineHeaderProps) {
  const me = useMe()
  const { colorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  const features = useFeatures((s) => s.features)
  const isHabitsEnabled = features.includes("habits")
  const isWeatherEnabled = features.includes("weather")
  const daysBack = useTimelineDays((s) => s.daysBack)

  const { data } = useQuery(
    ["habits", { daysBack }],
    async () => {
      const response = await fetch(`/api/habits?back=${daysBack}`)
      if (!response.ok) throw new Error("Failed to load tasks")
      return response.json() as Promise<TimelineHabitResponse>
    },
    { refetchOnWindowFocus: false, enabled: !!me.stripeSubscriptionId && isHabitsEnabled },
  )
  const habits = data?.habits || []
  const habitEntries = data?.habitEntries || []

  const { data: weatherData } = useQuery(
    ["/api/weather"],
    async () => {
      const response = await fetch(`/api/weather`)
      if (!response.ok) throw new Error("Network response was not ok")
      return response.json() as Promise<WeatherData>
    },
    { enabled: isWeatherEnabled, staleTime: 1_200_000, keepPreviousData: true },
  )

  return (
    <c.Flex
      minH={isHabitsEnabled ? HEADER_HABIT_HEIGHT : HEADER_HEIGHT}
      w="min-content"
      bg={isDark ? "gray.800" : "white"}
      borderBottom="1px solid"
      borderColor={isDark ? "gray.700" : "gray.100"}
      borderRight="1px solid"
      borderRightColor="tranparent"
    >
      <c.Image position="absolute" top={5} left={5} src="/logo.png" boxSize="32px" />
      {months.map(({ month, year }) => (
        <c.Box key={month + year}>
          <c.Flex pt={4} pl={4} position="sticky" w="max-content" left={12} align="center">
            <c.Heading as="h3" fontSize="3xl">
              {MONTH_NAMES[month]}
            </c.Heading>
            {isLoading && <c.Spinner size="sm" ml={4} mt={1} />}
          </c.Flex>
          <c.Flex>
            {days
              .filter((day) => month === dayjs(day).month() && year === dayjs(day).year())
              .map((day) => (
                <HeaderDay
                  key={day}
                  day={day}
                  habits={habits}
                  habitEntries={habitEntries}
                  weather={weatherData?.find((w) => w.date === dayjs(day).format("DD/MM/YYYY"))}
                  isWeatherEnabled={isWeatherEnabled}
                  isHabitsEnabled={
                    isHabitsEnabled && !!me.stripeSubscriptionId && !dayjs(day).startOf("d").isAfter(dayjs())
                  }
                />
              ))}
          </c.Flex>
        </c.Box>
      ))}
    </c.Flex>
  )
}

const HeaderDay = React.memo(_HeaderDay)
function _HeaderDay(props: {
  day: string
  habits: TimelineHabitResponse["habits"]
  habitEntries: TimelineHabitResponse["habitEntries"]
  weather?: DayWeather
  isHabitsEnabled: boolean
  isWeatherEnabled: boolean
}) {
  return (
    <c.VStack spacing={0} px={2} minW={DAY_WIDTH} key={dayjs(props.day).unix()}>
      <c.HStack spacing={0} h="34px" overflow="hidden">
        {props.isWeatherEnabled && props.weather && (
          <>
            <c.Text fontSize="x-small" opacity={0.8}>
              {props.weather.temp}°C
            </c.Text>
            <c.Image
              src={`https://openweathermap.org/img/wn/${props.weather.icon}@2x.png`}
              boxSize="35px"
              objectFit="cover"
            />
          </>
        )}
      </c.HStack>
      <c.Text
        textAlign="center"
        fontSize="sm"
        fontWeight={dayjs(props.day).isSame(dayjs(), "day") ? 700 : 400}
      >
        {dayjs(props.day).format("ddd Do")}
      </c.Text>
      {props.isHabitsEnabled && (
        <Habits
          day={dayjs(props.day).format("YYYY-MM-DD")}
          habits={props.habits}
          habitEntries={props.habitEntries.filter((e) =>
            dayjs(dayjs(props.day).format("YYYY-MM-DD")).isSame(
              dayjs(e.createdAt).format("YYYY-MM-DD"),
              "date",
            ),
          )}
        />
      )}
    </c.VStack>
  )
}
