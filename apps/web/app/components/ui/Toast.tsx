"use client"
import * as React from "react"
import { toast, Toaster as SToaster } from "sonner"

import { type RootLoader } from "~/root"

interface Props {
  flash: RootLoader["flash"]
}
export function Toaster({ flash }: Props) {
  return (
    <>
      <SToaster closeButton />
      {flash && <ShowToast flash={flash} />}
    </>
  )
}

function ShowToast({ flash }: Props) {
  React.useEffect(() => {
    if (!flash) return
    // timeout used to prevent reacts double render causing two flashes in dev
    const timeout = setTimeout(() => {
      toast[flash.type](flash.title, { description: flash.description })
    }, 0)
    return () => {
      clearTimeout(timeout)
    }
  }, [flash])
  return null
}
