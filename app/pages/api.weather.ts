import type { LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import cookie from "cookie"
import dayjs from "dayjs"

import { OPEN_WEATHER_KEY } from "~/lib/config.server"
import { requireUser } from "~/services/auth/auth.server"

import { USER_LOCATION_COOKIE_KEY } from "./_app.timeline.profile.settings"

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request)
  const weatherData = await getWeatherData(request)
  return json(weatherData)
}
export type WeatherData = SerializeFrom<typeof loader>

type WeatherResponse = {
  daily: {
    dt: number
    sunrise: number
    sunset: number
    moonrise: number
    moonset: number
    moon_phase: number
    temp: {
      day: number
      min: number
      max: number
      night: number
      eve: number
      morn: number
    }
    feels_like: { day: number; night: number; eve: number; morn: number }
    pressure: number
    humidity: number
    dew_point: number
    wind_speed: number
    wind_deg: number
    wind_gust: number
    weather: [{ id: number; main: string; description: string; icon: string }]
    clouds: number
    pop: number
    rain: number
    uvi: number
  }[]
}

async function getWeatherData(request: Request) {
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
      description: day.weather[0].description,
      sunrise: dayjs.unix(day.sunrise).format("HH:mm"),
      sunset: dayjs.unix(day.sunset).format("HH:mm"),
      date: dayjs.unix(day.dt).format("DD/MM/YYYY"),
      icon: day.weather[0]?.icon,
      humidity: day.humidity,
      windSpeed: Math.round(day.wind_speed),
      windDirection: day.wind_deg,
      rain: day.rain,
      temp: {
        max: Math.round(day.temp.max),
        min: Math.round(day.temp.min),
      },
    }))
  } catch (error) {
    console.log(error)
    return null
  }
}
