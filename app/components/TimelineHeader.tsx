import * as c from "@chakra-ui/react"
import dayjs from "dayjs"

import { transformImage } from "~/lib/helpers/image"
import { MONTH_NAMES } from "~/lib/helpers/timeline"

import { DAY_WIDTH } from "./Day"

export const HEADER_HEIGHT = 95

interface TimelineHeaderProps {
  isLoading: boolean
  days: dayjs.Dayjs[]
  logo?: string | null
  months: { month: number; year: number }[]
}

export function TimelineHeader({ days, months, logo, isLoading }: TimelineHeaderProps) {
  const { colorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
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
        top="8px"
        left={2}
        src={logo ? transformImage(logo, "w_80,h_80") : isDark ? "/logo-dark.png" : "/logo.png"}
        boxSize="40px"
      />
      {months.map(({ month, year }) => (
        <c.Box key={month + year}>
          <c.Flex position="sticky" w="max-content" pt={2} left={14} align="center">
            <c.Heading as="h3" fontSize="2em">
              {MONTH_NAMES[month]}
            </c.Heading>
            {isLoading && <c.Spinner size="sm" ml={4} mt={1} />}
          </c.Flex>
          <c.Flex>
            {days
              .filter((day) => month === day.month() && year === day.year())
              .map((day) => (
                <c.Text
                  key={day.unix()}
                  minW={DAY_WIDTH}
                  textAlign="center"
                  p={2}
                  fontSize="0.95rem"
                  fontWeight={dayjs(day).isSame(dayjs(), "day") ? 700 : 400}
                >
                  {day.format("ddd Do")}
                </c.Text>
              ))}
          </c.Flex>
        </c.Box>
      ))}
    </c.Flex>
  )
}
