import * as React from "react"
import { InView } from "react-intersection-observer"
import { join } from "@element/shared"
import * as HoverCard from "@radix-ui/react-hover-card"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { Droplet, MousePointer, Sunrise, Thermometer, Wind } from "lucide-react"

import { MONTH_NAMES } from "~/lib/helpers/timeline"
import { useFeatures } from "~/lib/hooks/useFeatures"
import { DATE_BACK } from "~/lib/hooks/useTimelineTaskDates"
import { useMe } from "~/lib/hooks/useUser"
import type { TimelineHabitResponse } from "~/pages/api+/habits"
import type { WeatherData } from "~/pages/api+/weather"

import { Habits } from "./Habits"
import { Spinner } from "./ui/Spinner"

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

  const features = useFeatures((s) => s.features)
  const isHabitsEnabled = !!me.stripeSubscriptionId && features.includes("habits")
  const isWeatherEnabled = features.includes("weather")

  const { data } = useQuery(
    ["habits"],
    async () => {
      const response = await fetch(`/api/habits?back=${DATE_BACK}`)
      if (!response.ok) throw new Error("Failed to load habits")
      return response.json() as Promise<TimelineHabitResponse>
    },
    { refetchOnWindowFocus: false, enabled: isHabitsEnabled },
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
    <div
      className={join(
        "flex w-min border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800",
        isHabitsEnabled ? "h-headerHabit" : "h-header",
      )}
    >
      <img className="sq-8 absolute left-5 top-5" src="/logo.png" alt="logo" />
      {months.map(({ month, year }) => (
        <div key={`${month}${year}`}>
          <div className="sticky left-12 flex w-max items-center pl-4 pt-4">
            <h3 className="text-3xl">{MONTH_NAMES[month]}</h3>
            {isLoading && <Spinner className="ml-4 mt-1" size="sm" />}
          </div>
          <div className="flex">
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
                  isHabitsEnabled={isHabitsEnabled && !!me.stripeSubscriptionId && !dayjs(day).startOf("day").isAfter(dayjs())}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
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
  const habitEntries = React.useMemo(
    () =>
      (props.isHabitsEnabled &&
        props.habits &&
        props.habitEntries.filter((e) =>
          dayjs(dayjs(props.day).format("YYYY-MM-DD")).isSame(dayjs(e.createdAt).format("YYYY-MM-DD"), "date"),
        )) ||
      [],
    [props.day, props.habitEntries, props.habits, props.isHabitsEnabled],
  )
  return (
    <InView>
      {({ ref, inView }) => (
        <div ref={ref} className="vstack w-day space-y-1 px-2">
          {inView && (
            <>
              <div className="h-9 overflow-hidden">
                {props.isWeatherEnabled && props.weather && (
                  <HoverCard.Root openDelay={0} closeDelay={50}>
                    <HoverCard.Trigger asChild>
                      <div className="flex items-center rounded-full border border-gray-100 px-3 dark:border-gray-700">
                        <p className="text-xs opacity-80">{props.weather.temp.max}°C</p>

                        <img
                          src={`https://openweathermap.org/img/wn/${props.weather.icon}@2x.png`}
                          className="sq-8 object-cover"
                          alt="weather icon"
                        />
                      </div>
                    </HoverCard.Trigger>

                    <HoverCard.Portal>
                      <HoverCard.Content
                        className="rounded-sm border border-gray-100 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
                        sideOffset={5}
                      >
                        <p className="border-b border-gray-100 p-2 dark:border-gray-600">
                          {dayjs(props.day).format("dddd Do")} -{" "}
                          {props.weather.description[0]?.toUpperCase() + props.weather.description.slice(1)}
                        </p>
                        <div className="p-2">
                          <div className="grid grid-cols-2 gap-2">
                            <WeatherStat icon={<Thermometer className="sq-3.5" />} label="Temp">
                              <div className="flex h-full flex-col justify-between">
                                <p className="text-2xl">{props.weather.temp.max}°</p>
                                <p className="text-xs">Min: {props.weather.temp.min}°</p>
                              </div>
                            </WeatherStat>
                            <WeatherStat icon={<Sunrise className="sq-3.5" />} label="Sunrise">
                              <div className="flex h-full flex-col justify-between">
                                <p className="text-2xl">{dayjs(props.weather.sunrise).format("HH:mm")}</p>
                                <p className="text-xs">Sunset: {dayjs(props.weather.sunset).format("HH:mm")}</p>
                              </div>
                            </WeatherStat>
                            <WeatherStat icon={<Droplet className="sq-3.5" />} label="Rain">
                              <div className="flex h-full flex-col justify-between">
                                <p className="text-2xl">{props.weather.rain} mm</p>
                                <p className="text-xs">Chance: {props.weather.chanceOfRain}%</p>
                              </div>
                            </WeatherStat>
                            <WeatherStat icon={<Wind className="sq-3.5" />} label="Wind">
                              <div className="flex h-full flex-col justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-2xl">
                                      {props.weather.windSpeed}
                                      <span className="text-lg">km/h</span>
                                    </p>
                                    <MousePointer
                                      className="sq-4 opacity-60"
                                      style={{ transform: `rotate(${135 + props.weather.windDirection}deg)` }}
                                    />
                                  </div>
                                </div>
                                <p className="text-xs">
                                  Gusts: {props.weather.windGust}
                                  <span>km/h</span>
                                </p>
                              </div>
                            </WeatherStat>
                          </div>
                        </div>
                        <HoverCard.Arrow className="z-[1000] fill-white dark:fill-gray-700" />
                      </HoverCard.Content>
                    </HoverCard.Portal>
                  </HoverCard.Root>
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-center text-sm">{dayjs(props.day).format("ddd Do")}</p>
                {props.isHabitsEnabled && props.habits && (
                  <Habits day={dayjs(props.day).format("YYYY-MM-DD")} habits={props.habits} habitEntries={habitEntries} />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </InView>
  )
}

function WeatherStat({ icon, children, label }: { icon: React.ReactNode; children: React.ReactNode; label: string }) {
  return (
    <div className="w-32 rounded-md border border-gray-100 p-2 dark:border-gray-600">
      <div className="flex items-center space-x-1 opacity-60">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <div className="h-16">{children}</div>
    </div>
  )
}
