import * as React from "react"

import { Button, type ButtonProps } from "./Button"

export const BrandButton = React.forwardRef<HTMLButtonElement, ButtonProps>(function _BrandButton(props, ref) {
  return <Button variant="primary" {...props} ref={ref} />
})
