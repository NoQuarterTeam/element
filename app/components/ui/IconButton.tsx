import * as React from "react"
import { type VariantProps, cva } from "class-variance-authority"

import { cn } from "~/lib/tailwind"

import { type ButtonProps, buttonStyles } from "./Button"
import { Spinner } from "./Spinner"

export const iconbuttonStyles = cva("px-0", {
  variants: {
    size: {
      xs: "sq-6",
      sm: "sq-8",
      md: "sq-10",
      lg: "sq-12",
    },
  },
  defaultVariants: {
    size: "sm",
  },
})
export type IconButtonStyleProps = VariantProps<typeof iconbuttonStyles>

export type IconButtonProps = IconButtonStyleProps & ButtonProps & { icon: React.ReactNode; "aria-label": string }

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function _IconButton(
  { variant, size, rounded, colorScheme, isLoading, disabled, icon, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      {...props}
      className={cn(buttonStyles({ colorScheme, rounded, disabled, variant }), iconbuttonStyles({ size }), props.className)}
    >
      <div className="center h-full w-full">{isLoading ? <Spinner /> : icon}</div>
    </button>
  )
})
