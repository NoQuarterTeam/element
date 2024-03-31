import { merge } from "@element/shared"
import { Link, type LinkProps } from "@remix-run/react"
import * as React from "react"

import { type ButtonStyleProps, buttonSizeStyles, buttonStyles } from "./Button"
import { Spinner } from "./Spinner"

interface LinkButtonProps extends ButtonStyleProps, LinkProps {
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(function _LinkButton(
  { variant = "primary", size, isLoading, leftIcon, rightIcon, disabled, ...props },
  ref,
) {
  return (
    <Link
      ref={ref}
      {...props}
      className={merge(
        buttonStyles({ size, variant, disabled }),
        buttonSizeStyles({ size }),
        disabled && "pointer-events-none",
        props.className,
      )}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" color={variant === "primary" || variant === "destructive" ? "white" : "black"} />
        </div>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {props.children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </Link>
  )
})
