import * as React from "react"
let hydrating = true

export function ClientOnly(props: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(() => !hydrating)
  React.useEffect(() => {
    hydrating = false
    setHydrated(true)
  }, [])
  if (!hydrated) return null
  return <>{props.children}</>
}
