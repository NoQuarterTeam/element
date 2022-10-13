import * as React from "react"
import type { IconButtonProps, TooltipProps } from "@chakra-ui/react"
import { IconButton, Tooltip } from "@chakra-ui/react"

interface Props extends IconButtonProps {
  tooltipProps: Omit<TooltipProps, "children">
}

export const TooltipIconButton = React.forwardRef(
  ({ tooltipProps, ...iconButtonProps }: Props, ref: React.Ref<HTMLButtonElement>) => (
    <Tooltip {...tooltipProps}>
      <IconButton {...iconButtonProps} ref={ref} />
    </Tooltip>
  ),
)
