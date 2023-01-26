import * as React from "react"
import { useLocation } from "@remix-run/react"
import * as FathomClient from "fathom-client"

export function Fathom() {
  const fathomLoaded = React.useRef(false)
  const location = useLocation()

  React.useEffect(
    function setupFathom() {
      if (!fathomLoaded.current) {
        FathomClient.load("CUPSLVZQ", { includedDomains: ["element.noquarter.co", "myelement.app"] })
        fathomLoaded.current = true
      } else {
        FathomClient.trackPageview()
      }
    },
    [location.pathname, location.search],
  )
  return null
}
