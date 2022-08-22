import * as c from "@chakra-ui/react"
import dayjs from "dayjs"

import { transformImage } from "~/lib/helpers/image"
import { MONTH_NAMES } from "~/lib/helpers/timeline"
import { useUserLocation } from "~/lib/hooks/useUserLocation"
import type { WeatherData } from "~/pages/_timeline.index"

import { DAY_WIDTH } from "./Day"

export const HEADER_HEIGHT = 95

interface TimelineHeaderProps {
  weatherData?: WeatherData | null
  isLoading: boolean
  days: dayjs.Dayjs[]
  logo?: string | null
  months: { month: number; year: number }[]
}

export function TimelineHeader({ weatherData, days, months, logo, isLoading }: TimelineHeaderProps) {
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
        position="fixed"
        top="2px"
        left={2}
        src={logo ? transformImage(logo, "w_80,h_80") : isDark ? "/logo-dark.png" : "/logo.png"}
        boxSize="26px"
      />
      {months.map(({ month, year }) => (
        <c.Box key={month + year}>
          <c.Flex position="sticky" w="max-content" left={12} align="center">
            <c.Heading pl={2} as="h3" pt={1} fontSize="3xl">
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
                    {isWeatherEnabled && dayWeather ? (
                      <c.HStack spacing={0} maxH="25px" overflow="hidden">
                        <c.Text fontSize="x-small" opacity={0.8}>
                          {dayWeather.temp}°C
                        </c.Text>
                        <c.Image
                          src={`https://openweathermap.org/img/wn/${dayWeather.icon}@2x.png`}
                          boxSize="35px"
                          objectFit="cover"
                        />
                      </c.HStack>
                    ) : (
                      <c.Box h="25px" />
                    )}
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
