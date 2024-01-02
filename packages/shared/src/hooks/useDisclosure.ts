"use client"
import * as React from "react"

export function useDisclosure({ defaultIsOpen = false }: { defaultIsOpen?: boolean } | undefined = {}) {
  const [isOpen, setIsOpen] = React.useState(defaultIsOpen)
  const onOpen = React.useCallback(() => setIsOpen(true), [])
  const onClose = React.useCallback(() => setIsOpen(false), [])
  const onToggle = React.useCallback(() => setIsOpen((o) => !o), [])

  return { isOpen, onOpen, onClose, onToggle, onSetIsOpen: setIsOpen }
}

export type UseDisclosure = ReturnType<typeof useDisclosure>
