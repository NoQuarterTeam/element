import { type LinkProps, Link } from "@remix-run/react"
import clsx from "clsx"

import { type ButtonStyleProps, buttonSizeStyleProps, buttonStyles } from "./Button"
import { Spinner } from "./Spinner"

interface LinkButtonProps extends ButtonStyleProps, LinkProps {
  isLoading?: boolean
  leftIcon?: React.ReactNode
}

export function LinkButton({ variant, size, isLoading, leftIcon, disabled, colorScheme, ...props }: LinkButtonProps) {
  return (
    <div className={disabled ? "cursor-not-allowed" : undefined}>
      <Link
        style={{ pointerEvents: disabled ? "none" : undefined }}
        className={clsx(
          buttonStyles({ size, colorScheme, variant, disabled }),
          buttonSizeStyleProps({ size }),
          "block",
          props.className,
        )}
        {...props}
      >
        <div className={clsx("center", isLoading ? "opacity-0" : "")} aria-hidden={isLoading}>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {props.children}
        </div>
        {isLoading && (
          <div className="center absolute inset-0">
            <Spinner size={size} />
          </div>
        )}
      </Link>
    </div>
  )
}
