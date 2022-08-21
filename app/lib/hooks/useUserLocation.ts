import React from "react"
import Cookies from "js-cookie"
import create from "zustand"
import { persist } from "zustand/middleware"

import { useToast } from "./useToast"

export const USER_LOCATION_COOKIE_KEY = "element.user.location"

export const USER_LOCATION_ENABLED_KEY = "element.user.location.enabled"

export const useStoredLocationEnabled = create<{
  isEnabled: boolean
  toggle: () => void
}>()(
  persist(
    (set) => ({
      isEnabled: false,
      toggle: () => set(({ isEnabled }) => ({ isEnabled: !isEnabled })),
    }),
    { name: USER_LOCATION_ENABLED_KEY },
  ),
)

export function useUserLocation() {
  const locationEnabledProps = useStoredLocationEnabled()
  const toast = useToast()

  const setLocation = React.useCallback(() => {
    function handleError(error: any) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          return
        case error.POSITION_UNAVAILABLE:
          return toast({ description: "Location information is unavailable.", status: "error" })
        case error.TIMEOUT:
          return toast({ description: "The request to get user location timed out.", status: "error" })
        case error.UNKNOWN_ERROR:
          return toast({ description: "An unknown error occurred.", status: "error" })
      }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        Cookies.set(
          USER_LOCATION_COOKIE_KEY,
          JSON.stringify({ lat: coords.latitude, lon: coords.longitude }),
          { expires: 10000 },
        )
      }, handleError)
    } else {
      return toast({ description: "Geolocation is not supported by this browser.", status: "error" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (locationEnabledProps.isEnabled) {
      setLocation()
    }
  }, [locationEnabledProps.isEnabled, setLocation])
  return locationEnabledProps
}
