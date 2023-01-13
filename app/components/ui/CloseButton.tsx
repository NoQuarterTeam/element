import * as React from "react"
import { BiX } from "react-icons/bi"

import { type IconButtonProps, IconButton } from "./IconButton"

export const CloseButton = React.forwardRef<HTMLButtonElement, Omit<IconButtonProps, "ref" | "icon" | "aria-label">>(
  function _CloseButton(props, ref) {
    return <IconButton ref={ref} variant="ghost" icon={<BiX />} aria-label="close" size="xs" {...props} />
  },
)
