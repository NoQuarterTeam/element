import * as React from "react"
import { Outlet } from "@remix-run/react"

let hydrating = true

export default function PublicTimelineLayout() {
  // client side render the timeline, so the react-beautiful-dnd library doesnt freak out
  const [hydrated, setHydrated] = React.useState(() => !hydrating)
  React.useEffect(() => {
    hydrating = false
    setHydrated(true)
  }, [])
  if (!hydrated) return null
  return <Outlet />
}
