import * as React from "react"
import { type SerializeFrom } from "@remix-run/node"

import { type loader } from "~/root"

import { useToast } from "./ui/Toast"

interface Props {
  flash: SerializeFrom<typeof loader>["flash"]
}

export function FlashMessage(props: Props) {
  const toast = useToast()
  React.useEffect(() => {
    if (props.flash.flashError) {
      toast({ description: props.flash.flashError, status: "error" })
    }
    if (props.flash.flashSuccess) {
      toast({ description: props.flash.flashSuccess, status: "success" })
    }
    if (props.flash.flashInfo) {
      toast({ description: props.flash.flashInfo, status: "info" })
    }
  }, [props.flash])
  return null
}
