import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import cookie from "cookie"
import dayjs from "dayjs"

import { OPEN_WEATHER_KEY } from "~/lib/config.server"
import { USER_LOCATION_COOKIE_KEY } from "~/lib/hooks/useUserLocationEnabled"
import { requireUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request)
  const weatherData = await getWeatherData(request)
  return json(weatherData)
}
export type WeatherData = UseDataFunctionReturn<typeof loader>

type WeatherResponse = {
  daily: {
    dt: number
    sunrise: number
    sunset: number
    moonrise: number
    moonset: number
    moon_phase: number
    temp: { day: number; max: number }
    feels_like: [any]
    pressure: number
    humidity: number
    dew_point: number
    wind_speed: number
    wind_deg: number
    wind_gust: number
    weather: [{ icon: string }]
    clouds: number
    pop: number
    rain: number
    uvi: number
  }[]
}

export async function getWeatherData(request: Request) {
  try {
    const cookies = cookie.parse(request.headers.get("cookie") || "")
    const userLocation = cookies[USER_LOCATION_COOKIE_KEY]
    if (!userLocation) return null
    const { lat, lon } = JSON.parse(userLocation)
    if (!lat || !lon) return null
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?exclude=minutely,hourly,current,alerts&units=metric&lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_KEY}`,
    )
    const json = (await res.json()) as WeatherResponse
    if (!json.daily) return null
    return json.daily.map((day) => ({
      date: dayjs.unix(day.dt).format("DD/MM/YYYY"),
      icon: day.weather[0]?.icon,
      temp: Math.round(day.temp.max),
    }))
  } catch (error) {
    console.log(error)
    return null
  }
}
