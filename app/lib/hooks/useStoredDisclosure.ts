import * as React from "react"
import * as c from "@chakra-ui/react"

export function useStoredDisclosure(key: string, args?: c.UseDisclosureProps) {
  const disclosureProps = c.useDisclosure({
    defaultIsOpen: localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key) || "false") : args?.defaultIsOpen,
  })

  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(disclosureProps.isOpen))
  }, [key, disclosureProps.isOpen])
  return disclosureProps
}
