"use client"
import * as React from "react"
import { merge } from "@element/shared"
import { cva, type VariantProps } from "class-variance-authority"

import { type ButtonProps, buttonStyles } from "./Button"
import { Spinner } from "./Spinner"

export const iconbuttonStyles = cva("px-0", {
  variants: {
    size: {
      xs: "sq-7",
      sm: "sq-8",
      md: "sq-9",
      lg: "sq-11",
    },
    rounded: {
      true: "rounded-full",
    },
  },
  defaultVariants: {
    size: "md",
    rounded: false,
  },
})
export type IconButtonStyleProps = VariantProps<typeof iconbuttonStyles>

export type IconButtonProps = IconButtonStyleProps & ButtonProps & { icon: React.ReactNode; "aria-label": string }

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function _IconButton(
  { variant = "secondary", rounded, size, isLoading, disabled, icon, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || isLoading}
      {...props}
      className={merge(
        buttonStyles({ size, disabled: disabled || isLoading, variant }),
        iconbuttonStyles({ size, rounded }),
        props.className,
      )}
    >
      <div className="flex h-full w-full items-center justify-center">{isLoading ? <Spinner size="xs" /> : icon}</div>
    </button>
  )
})
