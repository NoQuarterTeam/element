import * as React from "react"
import { useToast } from "@chakra-ui/react"
import * as c from "@chakra-ui/react"
import Cookies from "js-cookie"

import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useFeatures } from "~/lib/hooks/useFeatures"

import { useMe } from "./_app"
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
          Cookies.set(
            USER_LOCATION_COOKIE_KEY,
            JSON.stringify({ lat: coords.latitude, lon: coords.longitude }),
            { expires: 10000 },
          )
          await sleep()
          toggle("weather")
        }, handleError)
      } else {
        return toast({ description: "Geolocation is not supported by this browser.", status: "error" })
      }
    }
  }

  return (
    <c.Stack spacing={4}>
      <c.Text fontSize="lg" fontWeight={500}>
        Settings
      </c.Text>
      <c.Stack>
        <c.HStack>
          <c.Text fontSize="sm">Weather</c.Text>
          <c.Badge size="sm" colorScheme="primary">
            New
          </c.Badge>
        </c.HStack>
        <c.Text fontSize="xs">Show the next weeks weather based on your current location.</c.Text>
        <c.Switch onChange={handleToggleWeather} defaultChecked={features.includes("weather")} />
      </c.Stack>
      <c.Divider />
      <c.Stack>
        <c.HStack>
          <c.Text fontSize="sm">Habits</c.Text>
          <c.Badge size="sm" colorScheme="primary">
            New
          </c.Badge>
          <c.Badge size="sm" colorScheme="red">
            Pro
          </c.Badge>
        </c.HStack>
        <c.Text fontSize="xs">Create and track habits.</c.Text>
        <c.Switch
          isDisabled={!me.stripeSubscriptionId}
          onChange={() => toggle("habits")}
          defaultChecked={!!me.stripeSubscriptionId && features.includes("habits")}
        />
      </c.Stack>
    </c.Stack>
  )
}
