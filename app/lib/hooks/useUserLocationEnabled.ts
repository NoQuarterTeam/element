import create from "zustand"
import { persist } from "zustand/middleware"

export const USER_LOCATION_COOKIE_KEY = "element.user.location"

export const USER_LOCATION_ENABLED_KEY = "element.user.location.enabled"

export const useUserLocationEnabled = create<{
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
