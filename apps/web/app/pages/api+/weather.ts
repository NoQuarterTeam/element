import { env } from "@element/server-env"
import type { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import cookie from "cookie"
import dayjs from "dayjs"

import { USER_LOCATION_COOKIE_KEY } from "~/pages/_app.timeline.profile.settings"
import { requireUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUser(request)
  const weatherData = await getWeatherData(request)
  return json(weatherData, { headers: { "Cache-Control": "private, max-age=3600, s-maxage=1800" } })
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
      `https://api.openweathermap.org/data/2.5/onecall?exclude=minutely,hourly,current,alerts&units=metric&lat=${lat}&lon=${lon}&appid=${env.OPEN_WEATHER_KEY}`,
    )
    const json = (await res.json()) as WeatherResponse
    if (!json.daily) return null

    return json.daily.map((day) => ({
      description: day.weather[0].description,
      sunrise: dayjs.unix(day.sunrise).format(),
      sunset: dayjs.unix(day.sunset).format(),
      date: dayjs.unix(day.dt).format("DD/MM/YYYY"),
      icon: day.weather[0]?.icon,
      humidity: day.humidity,
      windSpeed: Math.round(day.wind_speed * 3.6), // comes in m/s, convert to km/h
      windGust: Math.round(day.wind_gust * 3.6), // comes in m/s, convert to km/h
      windDirection: day.wind_deg,
      rain: day.rain || 0,
      chanceOfRain: Math.round(day.pop * 100),
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
