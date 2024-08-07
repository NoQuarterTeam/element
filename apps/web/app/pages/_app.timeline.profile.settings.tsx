import Cookies from "js-cookie"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "~/components/ui/Badge"
import { Input } from "~/components/ui/Inputs"
import { Switch } from "~/components/ui/Switch"
import { useConfig } from "~/lib/hooks/useConfig"
import { useFeatures, useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useMe } from "~/lib/hooks/useUser"
export const USER_LOCATION_COOKIE_KEY = "element.user.location"

export default function Settings() {
  const { features, toggle } = useFeatures()
  const config = useConfig()
  const me = useMe()
  const { setFeaturesSeen } = useFeaturesSeen()
  // biome-ignore lint/correctness/useExhaustiveDependencies: allow
  React.useEffect(() => {
    setFeaturesSeen(["weather", "habits"])
  }, [])
  const handleToggleWeather = () => {
    if (features.includes("weather")) {
      Cookies.remove(USER_LOCATION_COOKIE_KEY)
      toggle("weather")
    } else {
      const handleError: PositionErrorCallback = (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
          case error.POSITION_UNAVAILABLE:
            return
          case error.TIMEOUT:
            return toast.error("The request to get user location timed out.")
          default:
            return toast.error("An unknown error occurred.")
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
        return toast.error("Geolocation is not supported by this browser.")
      }
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-lg font-medium">Settings</p>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm">Weather</p>
        </div>
        <p className="text-xs">Show the next weeks weather based on your current location.</p>
        <Switch onCheckedChange={handleToggleWeather} defaultChecked={features.includes("weather")} />
      </div>
      <hr />
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm">Habits</p>
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
      <hr />
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm">Cal.com integration</p>
          <Badge size="sm" colorScheme="red">
            Pro
          </Badge>
        </div>
        <p className="text-xs">Copy and past this url into your Cal.com account's webhook section</p>
        <Input
          readOnly
          value={me.stripeSubscriptionId ? `${config.FULL_WEB_URL}/api/webhooks/cal/${me.id}` : "Subscribe to access"}
        />
      </div>
    </div>
  )
}
