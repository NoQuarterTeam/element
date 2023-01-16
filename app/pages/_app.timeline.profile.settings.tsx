import * as React from "react"

import Cookies from "js-cookie"

import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useFeatures } from "~/lib/hooks/useFeatures"

import { useMe } from "./_app"
import { Badge } from "~/components/ui/Badge"
import { Switch } from "~/components/ui/Switch"
import { useToast } from "~/components/ui/Toast"
export const USER_LOCATION_COOKIE_KEY = "element.user.location"

export default function Settings() {
  const { features, toggle } = useFeatures()
  const toast = useToast()
  const me = useMe()
  const { setFeaturesSeen } = useFeaturesSeen()
  React.useEffect(() => {
    setFeaturesSeen(["weather", "habits"])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const handleToggleWeather = () => {
    if (features.includes("weather")) {
      Cookies.remove(USER_LOCATION_COOKIE_KEY)
      toggle("weather")
    } else {
      function handleError(error: any) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
          case error.POSITION_UNAVAILABLE:
            return
          case error.TIMEOUT:
            return toast({ description: "The request to get user location timed out.", status: "error" })
          case error.UNKNOWN_ERROR:
            return toast({ description: "An unknown error occurred.", status: "error" })
        }
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
          const sleep = (delay = 200) => new Promise((res) => setTimeout(res, delay))
          Cookies.set(USER_LOCATION_COOKIE_KEY, JSON.stringify({ lat: coords.latitude, lon: coords.longitude }), {
            expires: 10000,
          })
          await sleep()
          toggle("weather")
        }, handleError)
      } else {
        return toast({ description: "Geolocation is not supported by this browser.", status: "error" })
      }
    }
  }

  return (
    <div className="stack">
      <p className="text-lg font-medium">Settings</p>
      <div className="stack">
        <div className="hstack">
          <p className="text-sm">Weather</p>
          <Badge size="sm" colorScheme="primary">
            New
          </Badge>
        </div>
        <p className="text-xs">Show the next weeks weather based on your current location.</p>
        <Switch onCheckedChange={handleToggleWeather} defaultChecked={features.includes("weather")} />
      </div>
      <hr />
      <div className="stack">
        <div className="hstack">
          <p className="text-sm">Habits</p>
          <Badge size="sm" colorScheme="primary">
            New
          </Badge>
          <Badge size="sm" colorScheme="red">
            Pro
          </Badge>
        </div>
        <p className="text-xs">Create and track habits.</p>
        <Switch
          disabled={!me.stripeSubscriptionId}
          onCheckedChange={() => toggle("habits")}
          defaultChecked={!!me.stripeSubscriptionId && features.includes("habits")}
        />
      </div>
    </div>
  )
}
