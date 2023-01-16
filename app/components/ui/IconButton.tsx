import * as React from "react"
import { cn } from "~/lib/tailwind"
import { type VariantProps, cva } from "class-variance-authority"

import { type ButtonProps, buttonStyles } from "./Button"
import { Spinner } from "./Spinner"

export const iconbuttonStyles = cva("px-0", {
  variants: {
    size: {
      xs: "min-h-[24px] min-w-[24px]",
      sm: "min-h-[32px] min-w-[32px]",
      md: "min-h-[40px] min-w-[40px]",
      lg: "min-h-[48px] min-w-[48px]",
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
