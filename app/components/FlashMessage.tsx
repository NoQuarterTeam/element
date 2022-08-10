import * as React from "react"

import { useToast } from "~/lib/hooks/useToast"
import type { FlashSession } from "~/services/session/session.server"

interface Props {
  flash: Partial<FlashSession["flash"]>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.flash])
  return null
}
