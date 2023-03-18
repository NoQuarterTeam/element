import { useRouter, useSegments } from "expo-router"
import * as React from "react"
import { api } from "../lib/utils/api"

export function AuthProvider(props: { children: React.ReactNode }) {
  const { data, isLoading } = api.auth.me.useQuery()
  const segments = useSegments()
  const router = useRouter()

  React.useEffect(() => {
    if (isLoading) return
    const inAuthGroup = segments[0] === "(auth)"
    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !data &&
      !inAuthGroup
    ) {
      // Redirect to the sign-in page.
      router.replace("/login")
    } else if (data && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace("/timeline")
    }
  }, [data, isLoading, segments])
  if (isLoading || !data) return null
  return <>{props.children}</>
}
