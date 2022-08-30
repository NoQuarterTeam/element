import * as React from "react"
import * as c from "@chakra-ui/react"
import { useFetcher } from "@remix-run/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import { MONTH_NAMES } from "~/lib/helpers/timeline"
import { useFeatures } from "~/lib/hooks/useFeatures"
import { useTimelineDays } from "~/lib/hooks/useTimelineDays"
import { useMe } from "~/pages/_app"
import type {
  TimelineHabit,
  TimelineHabitEntry,
  TimelineHabitResponse} from "~/pages/api.habits";
import {
  HabitsActionMethods
} from "~/pages/api.habits"
import { HabitActionMethods } from "~/pages/api.habits.$id"
import type { WeatherData } from "~/pages/api.weather"

import { ButtonGroup } from "./ButtonGroup"
import { DAY_WIDTH } from "./Day"
import { FormButton, FormError, FormField } from "./Form"

export const HEADER_HEIGHT = 115

export const HEADER_HABIT_HEIGHT = 138

interface TimelineHeaderProps {
  isLoading: boolean
  days: dayjs.Dayjs[]
  months: { month: number; year: number }[]
}

export function TimelineHeader({ days, months, isLoading }: TimelineHeaderProps) {
  const me = useMe()
  const { colorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  const features = useFeatures((s) => s.features)
  const daysBack = useTimelineDays((s) => s.daysBack)

  const isHabitsEnabled = features.includes("habits")
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

  const isWeatherEnabled = features.includes("weather")
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
                    {isHabitsEnabled &&
                      !!me.stripeSubscriptionId &&
                      !dayjs(day).startOf("d").isAfter(dayjs()) && (
                        <Habits
                          day={day.format("YYYY-MM-DD")}
                          habits={habits}
                          habitEntries={habitEntries.filter((e) =>
                            dayjs(day.format("YYYY-MM-DD")).isSame(
                              dayjs(e.createdAt).format("YYYY-MM-DD"),
                              "date",
                            ),
                          )}
                        />
                      )}
                  </c.VStack>
                )
              })}
          </c.Flex>
        </c.Box>
      ))}
    </c.Flex>
  )
}

interface HabitProps {
  habits: TimelineHabit[]
  day: string
  habitEntries: TimelineHabitEntry[]
}
function Habits({ habits, day, habitEntries }: HabitProps) {
  const habitBgRed = c.useColorModeValue("red.300", "red.700")
  const habitBgGreen = c.useColorModeValue("green.400", "green.600")
  const habitsModalProps = c.useDisclosure()
  const habitEntryFetcher = useFetcher()
  const client = useQueryClient()
  const daysBack = useTimelineDays((s) => s.daysBack)
  const initialFocusRef = React.useRef(null)
  const initialNewFocusRef = React.useRef(null)
  const filteredHabits = habits.filter((h) => dayjs(h.startDate).isBefore(dayjs(day).endOf("d")))
  const createFetcher = useFetcher()
  const createFormProps = c.useDisclosure()
  React.useEffect(() => {
    if (createFetcher.type === "actionReload" && createFetcher.data?.habit) {
      const res = client.getQueryData<TimelineHabitResponse>(["habits", { daysBack }])
      if (!res) return
      client.setQueryData<TimelineHabitResponse>(["habits", { daysBack }], {
        habits: [...res.habits, createFetcher.data.habit],
        habitEntries: res.habitEntries || [],
      })
      createFormProps.onClose()
    }
  }, [createFetcher.type, createFetcher.data])

  return (
    <c.Popover initialFocusRef={initialFocusRef}>
      <c.PopoverTrigger>
        <c.Button size="xs" w="100%" tabIndex={-1} variant="ghost" onClick={habitsModalProps.onOpen}>
          <c.HStack spacing="3px">
            {filteredHabits.map((habit) => (
              <c.Box
                key={habit.id}
                boxSize="10px"
                borderRadius="full"
                bg={habitEntries.find((e) => e.habitId === habit.id) ? habitBgGreen : habitBgRed}
              />
            ))}
          </c.HStack>
        </c.Button>
      </c.PopoverTrigger>

      <c.PopoverContent>
        <c.PopoverHeader>Habits</c.PopoverHeader>
        <c.PopoverArrow />
        <c.PopoverCloseButton ref={initialFocusRef} />
        <c.PopoverBody>
          <c.Stack>
            {filteredHabits.map((habit) => {
              const entry = habitEntries.find((e) => e.habitId === habit.id)
              return (
                <c.Flex key={habit.id} align="center" justify="space-between">
                  <c.Text fontSize="md">{habit.name}</c.Text>
                  <c.Checkbox
                    defaultChecked={!!entry}
                    onChange={() => {
                      habitEntryFetcher.submit(
                        { _action: HabitActionMethods.ToggleComplete, date: dayjs(day).format() },
                        { action: `/api/habits/${habit.id}`, method: "post" },
                      )
                      const res = client.getQueryData<TimelineHabitResponse>(["habits", { daysBack }])
                      if (!res) return
                      client.setQueryData<TimelineHabitResponse>(["habits", { daysBack }], {
                        habits: res.habits || [],
                        habitEntries: entry
                          ? res.habitEntries.filter((e) => e.id !== entry.id)
                          : [
                              ...res.habitEntries,
                              {
                                id: new Date().getMilliseconds().toString(),
                                habitId: habit.id,
                                createdAt: dayjs(day).startOf("d").add(12, "h").format(),
                              },
                            ],
                      })
                    }}
                  />
                </c.Flex>
              )
            })}
          </c.Stack>
        </c.PopoverBody>
        <c.PopoverFooter>
          <c.Popover isLazy placement="right-start" initialFocusRef={initialNewFocusRef} {...createFormProps}>
            <ButtonGroup>
              <c.PopoverTrigger>
                <c.Button isDisabled={habits.length >= 5} onClick={createFormProps.onOpen}>
                  New habbit
                </c.Button>
              </c.PopoverTrigger>
            </ButtonGroup>
            {habits.length < 5 && (
              <c.PopoverContent>
                <c.PopoverHeader>New habbit</c.PopoverHeader>
                <c.PopoverArrow />
                <c.PopoverCloseButton onClick={createFormProps.onClose} />
                <c.PopoverBody>
                  <createFetcher.Form action="/api/habits" replace method="post">
                    <c.Stack>
                      <FormField ref={initialNewFocusRef} autoFocus name="name" label="Name" />
                      <input type="hidden" value={day} name="date" />
                      <FormError />
                      <ButtonGroup>
                        <FormButton
                          isLoading={createFetcher.state !== "idle"}
                          isDisabled={createFetcher.state !== "idle"}
                          name="_action"
                          value={HabitsActionMethods.CreateHabit}
                        >
                          Save
                        </FormButton>
                      </ButtonGroup>
                    </c.Stack>
                  </createFetcher.Form>
                </c.PopoverBody>
              </c.PopoverContent>
            )}
          </c.Popover>
        </c.PopoverFooter>
      </c.PopoverContent>
    </c.Popover>
  )
}
