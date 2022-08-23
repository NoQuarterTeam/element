import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime"

import { requireUser } from "~/services/auth/auth.server"
import { getWeatherData } from "~/services/weather/weather.server"

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request)
  const weatherData = await getWeatherData(request)
  return json(weatherData)
}
export type WeatherData = UseDataFunctionReturn<typeof loader>
