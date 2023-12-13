import { useCallback, useEffect, useRef,useState } from "react"
import { useRevalidator } from "@remix-run/react"

export function useRefetchOnFocus() {
  const shouldRefetch = useRef(false)
  const isVisible = usePageVisible()
  const revalidator = useRevalidator()

  useEffect(() => {
    if (isVisible && shouldRefetch.current) {
      revalidator.revalidate()
    }
    shouldRefetch.current = true
  }, [isVisible])
}

function usePageVisible() {
  const [isVisible, setVisible] = useState(isDocumentVisible())
  const onFocus = useCallback(() => {
    setVisible(isDocumentVisible())
  }, [])
  useEffect(() => setupEventListeners(onFocus), [onFocus])

  return isVisible
}

function isDocumentVisible(): boolean {
  if (typeof document === "undefined") {
    return true
  }
  return [undefined, "visible", "prerender"].includes(document.visibilityState)
}

function setupEventListeners(onFocus: () => void) {
  addEventListener("visibilitychange", onFocus, false)
  addEventListener("focus", onFocus, false)

  return () => {
    removeEventListener("visibilitychange", onFocus)
    removeEventListener("focus", onFocus)
  }
}
