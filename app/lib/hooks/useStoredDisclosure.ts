import * as React from "react"

import { useModal } from "~/components/ui/Modal"

export function useStoredDisclosure(key: string, args?: { defaultIsOpen?: boolean }) {
  const modalProps = useModal({
    defaultIsOpen: localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key) || "false") : args?.defaultIsOpen,
  })

  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(modalProps.isOpen))
  }, [key, modalProps.isOpen])
  return modalProps
}
