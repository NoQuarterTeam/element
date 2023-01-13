import React from "react"
import { type ButtonProps, Button } from "./Button"

export const BrandButton = React.forwardRef<HTMLButtonElement, ButtonProps>(function BrandButton(props, ref) {
  return <Button colorScheme="primary" {...props} ref={ref} />
})
