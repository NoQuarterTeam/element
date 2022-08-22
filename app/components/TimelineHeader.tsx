import * as c from "@chakra-ui/react"
import dayjs from "dayjs"

import { MONTH_NAMES } from "~/lib/helpers/timeline"
import { useUserLocation } from "~/lib/hooks/useUserLocation"
import type { WeatherData } from "~/pages/_timeline.index"

import { DAY_WIDTH } from "./Day"

export const HEADER_HEIGHT = 115

interface TimelineHeaderProps {
  weatherData?: WeatherData | null
  isLoading: boolean
  days: dayjs.Dayjs[]
  months: { month: number; year: number }[]
}

export function TimelineHeader({ weatherData, days, months, isLoading }: TimelineHeaderProps) {
  const { colorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  const isWeatherEnabled = useUserLocation().isEnabled

  return (
    <c.Flex
      minH={HEADER_HEIGHT}
      w="min-content"
      bg={isDark ? "gray.800" : "white"}
      borderBottom="1px solid"
      borderColor={isDark ? "gray.700" : "gray.100"}
      borderRight="1px solid"
      borderRightColor="tranparent"
    >
      <c.Image
        position="absolute"
        top={4}
        left={4}
        src={isDark ? "/logo-dark.png" : "/logo.png"}
        boxSize="40px"
      />
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
              .filter((day) => month === day.month() && year === day.year())
              .map((day) => {
                const dayWeather = weatherData?.find((d) => d.date === day.format("DD/MM/YYYY"))
                return (
                  <c.VStack spacing={0} px={2} minW={DAY_WIDTH} key={day.unix()}>
                    <c.HStack spacing={0} h="34px" overflow="hidden">
                      {isWeatherEnabled && dayWeather && (
                        <>
                          <c.Text fontSize="x-small" opacity={0.8}>
                            {dayWeather.temp}°C
                          </c.Text>
                          <c.Image
                            src={`https://openweathermap.org/img/wn/${dayWeather.icon}@2x.png`}
                            boxSize="35px"
                            objectFit="cover"
                          />
                        </>
                      )}
                    </c.HStack>
                    <c.Text
                      textAlign="center"
                      fontSize="sm"
                      fontWeight={dayjs(day).isSame(dayjs(), "day") ? 700 : 400}
                    >
                      {day.format("ddd Do")}
                    </c.Text>
                  </c.VStack>
                )
              })}
          </c.Flex>
        </c.Box>
      ))}
    </c.Flex>
  )
}
