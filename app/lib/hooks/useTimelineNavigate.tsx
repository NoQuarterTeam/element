import { useLocation, useNavigate } from "@remix-run/react"

export function useTimelineNavigate() {
  const location = useLocation()
  const navigate = useNavigate()
  return (path: string) => navigate(`${path}${location.search}`)
}
