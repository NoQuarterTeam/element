import * as React from "react"
import { useFetcher } from "@remix-run/react"

interface Props<T> {
  onSuccess?: (data: T) => void
}
export function useFetcherSubmit<T>(props: Props<T>) {
  const fetcher = useFetcher()

  React.useEffect(() => {
    if (!fetcher.data) return
    if (fetcher.state === "loading" && fetcher.data !== null) {
      props.onSuccess?.(fetcher.data)
    }
  }, [fetcher.formMethod, fetcher.data])

  return fetcher
}
