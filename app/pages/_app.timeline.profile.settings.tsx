import * as React from "react"
import { useToast } from "@chakra-ui/react"
import * as c from "@chakra-ui/react"
import Cookies from "js-cookie"

import { useUpdatesSeen } from "~/lib/hooks/useUpdatesSeen"
import { USER_LOCATION_COOKIE_KEY, useUserLocationEnabled } from "~/lib/hooks/useUserLocationEnabled"

export default function Settings() {
  const userLocation = useUserLocationEnabled()
  const toast = useToast()
  const { setUpdatesSeens } = useUpdatesSeen()
  React.useEffect(() => {
    setUpdatesSeens(["weather"])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const handleToggleWeather = () => {
    if (userLocation.isEnabled) {
      Cookies.remove(USER_LOCATION_COOKIE_KEY)
      userLocation.toggle()
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
          userLocation.toggle()
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
        <c.Switch onChange={handleToggleWeather} defaultChecked={userLocation.isEnabled} />
      </c.Stack>
    </c.Stack>
  )
}
