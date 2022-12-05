import * as React from "react"
import { BsSunrise, BsThermometerHalf } from "react-icons/bs"
import { RiWindyLine } from "react-icons/ri"
import { TbDroplet, TbLocation } from "react-icons/tb"
import * as c from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"

import { MONTH_NAMES } from "~/lib/helpers/timeline"
import { useFeatures } from "~/lib/hooks/useFeatures"
import { DATE_BACK } from "~/lib/hooks/useTimelineDates"
import { useMe } from "~/pages/_app"
import type { TimelineHabitResponse } from "~/pages/api.habits"
import type { WeatherData } from "~/pages/api.weather"

import { DAY_WIDTH } from "./Day"
import { Habits } from "./Habits"

export const HEADER_HEIGHT = 120

export const HEADER_HABIT_HEIGHT = 143

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

  const { data } = useQuery(
    ["habits"],
    async () => {
      const response = await fetch(`/api/habits?back=${DATE_BACK}`)
      if (!response.ok) throw new Error("Failed to load habits")
      return response.json() as Promise<TimelineHabitResponse>
    },
    { refetchOnWindowFocus: false, enabled: !!me.stripeSubscriptionId && isHabitsEnabled },
  )

  const habits = data?.habits
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
        <c.Box key={`${month}${year}`}>
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
  habits?: TimelineHabitResponse["habits"]
  habitEntries: TimelineHabitResponse["habitEntries"]
  weather?: NonNullable<WeatherData>[number]
  isHabitsEnabled: boolean
  isWeatherEnabled: boolean
}) {
  const borderColor = c.useColorModeValue("gray.100", "gray.700")

  const habitEntries = React.useMemo(
    () =>
      (props.isHabitsEnabled &&
        props.habits &&
        props.habitEntries.filter((e) =>
          dayjs(dayjs(props.day).format("YYYY-MM-DD")).isSame(
            dayjs(e.createdAt).format("YYYY-MM-DD"),
            "date",
          ),
        )) ||
      [],
    [props.day, props.habitEntries],
  )
  return (
    <c.VStack spacing={1} px={2} minW={DAY_WIDTH} key={dayjs(props.day).unix()}>
      <c.Box h="34px" overflow="hidden">
        {props.isWeatherEnabled && props.weather && (
          <c.Popover isLazy trigger="hover" openDelay={0} closeDelay={50} offset={[0, 4]}>
            <c.PopoverTrigger>
              <c.HStack spacing={0} border="1px solid" borderColor={borderColor} px={3} borderRadius="full">
                <c.Text fontSize="x-small" opacity={0.8}>
                  {props.weather.temp.max}°C
                </c.Text>

                <c.Image
                  src={`https://openweathermap.org/img/wn/${props.weather.icon}@2x.png`}
                  boxSize="32px"
                  objectFit="cover"
                />
              </c.HStack>
            </c.PopoverTrigger>
            <c.PopoverContent>
              <c.PopoverArrow />
              <c.PopoverHeader>
                {dayjs(props.day).format("dddd Do")} -{" "}
                {props.weather.description[0].toUpperCase() + props.weather.description.slice(1)}
              </c.PopoverHeader>
              <c.PopoverBody py={3}>
                <c.SimpleGrid columns={2} spacing={2}>
                  <WeatherStat icon={BsThermometerHalf} label="Temp">
                    <c.Flex justify="space-between" flexDir="column" h="100%">
                      <c.Text fontSize="2xl">{props.weather.temp.max}°</c.Text>
                      <c.Text fontSize="xs">Min: {props.weather.temp.min}°</c.Text>
                    </c.Flex>
                  </WeatherStat>
                  <WeatherStat icon={BsSunrise} label="Sunrise">
                    <c.Flex justify="space-between" flexDir="column" h="100%">
                      <c.Text fontSize="2xl">{dayjs(props.weather.sunrise).format("HH:mm")}</c.Text>
                      <c.Text fontSize="xs">Sunset: {dayjs(props.weather.sunset).format("HH:mm")}</c.Text>
                    </c.Flex>
                  </WeatherStat>
                  <WeatherStat icon={TbDroplet} label="Rain">
                    <c.Flex justify="space-between" flexDir="column" h="100%">
                      <c.Text fontSize="2xl">{props.weather.rain} mm</c.Text>
                      <c.Text fontSize="xs">Chance: {props.weather.chanceOfRain}%</c.Text>
                    </c.Flex>
                  </WeatherStat>
                  {/* <WeatherStat icon={WiHumidity} label="Humidity">
                    <c.Text fontSize="2xl">{props.weather.humidity}%</c.Text>
                  </WeatherStat> */}
                  <WeatherStat icon={RiWindyLine} label="Wind">
                    <c.Flex justify="space-between" flexDir="column" h="100%">
                      <c.Box>
                        <c.HStack spacing={2}>
                          <c.Text fontSize="2xl">
                            {props.weather.windSpeed}
                            <c.Text as="span" fontSize="lg">
                              km/h
                            </c.Text>
                          </c.Text>
                          <c.Box
                            as={TbLocation}
                            boxSize="16px"
                            style={{ transform: `rotate(${135 + props.weather.windDirection}deg)` }}
                            opacity={0.6}
                          />
                        </c.HStack>
                      </c.Box>
                      <c.Text fontSize="xs">
                        Gusts: {props.weather.windGust}
                        <c.Text as="span">km/h</c.Text>
                      </c.Text>
                    </c.Flex>
                  </WeatherStat>
                </c.SimpleGrid>
              </c.PopoverBody>
            </c.PopoverContent>
          </c.Popover>
        )}
      </c.Box>
      <c.VStack spacing="2px">
        <c.Text textAlign="center" fontSize="sm">
          {dayjs(props.day).format("ddd Do")}
        </c.Text>
        {props.isHabitsEnabled && props.habits && (
          <Habits
            day={dayjs(props.day).format("YYYY-MM-DD")}
            habits={props.habits}
            habitEntries={habitEntries}
          />
        )}
      </c.VStack>
    </c.VStack>
  )
}

function WeatherStat({
  icon,
  children,
  label,
}: {
  icon: React.ElementType
  children: React.ReactNode
  label: string
}) {
  const borderColor = c.useColorModeValue("gray.100", "gray.600")

  return (
    <c.Box p={2} borderRadius="md" border="1px solid" borderColor={borderColor}>
      <c.HStack spacing={1} opacity={0.6}>
        <c.Box as={icon} boxSize="14px" />
        <c.Text fontSize="sm">{label}</c.Text>
      </c.HStack>
      <c.Box h="65px">{children}</c.Box>
    </c.Box>
  )
}
