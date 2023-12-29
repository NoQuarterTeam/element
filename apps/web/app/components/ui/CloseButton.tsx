import * as React from "react"
import { X } from "lucide-react"

import { IconButton, type IconButtonProps } from "./IconButton"

export const CloseButton = React.forwardRef<HTMLButtonElement, Omit<IconButtonProps, "ref" | "icon" | "aria-label">>(
  function _CloseButton(props, ref) {
    return <IconButton ref={ref} variant="ghost" icon={<X size={16} />} aria-label="close" size="xs" {...props} />
  },
)
