import * as React from "react"
import { join, merge } from "@element/shared"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

import { Spinner } from "./Spinner"

export const buttonStyles = cva("center flex border border-transparent font-semibold transition-colors duration-200", {
  variants: {
    size: {
      xs: "px-2 text-xs",
      sm: "px-2 text-sm",
      md: "text-md px-4",
      lg: "px-5 text-lg",
    },
    variant: {
      solid: "border-transparent",
      outline: "bg-transparent",
      ghost: "border-transparent bg-transparent",
    },
    colorScheme: {
      gray: "text-black dark:text-white",
      primary: "text-white",
      red: "text-white",
    },
    disabled: {
      true: "pointer-events-none relative opacity-70",
    },
    rounded: {
      xs: "rounded-xs",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    },
  },
  compoundVariants: [
    // GRAY
    {
      colorScheme: "gray",
      variant: ["solid"],
      className:
        "bg-black/10 hover:bg-black/20 active:bg-black/30 dark:bg-white/10 dark:hover:bg-white/20 dark:active:bg-white/30",
    },
    {
      colorScheme: "gray",
      variant: ["ghost", "outline"],
      className: "hover:bg-black/10 active:bg-black/20 dark:hover:bg-white/10 dark:active:bg-white/20",
    },
    {
      colorScheme: "gray",
      variant: ["outline"],
      className: "border-black/10 dark:border-white/10",
    },
    // PINK
    {
      colorScheme: ["primary"],
      variant: ["solid"],
      className: "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white",
    },
    {
      colorScheme: "primary",
      variant: ["ghost", "outline"],
      className: "hover:bg-primary-500/10 active:bg-primary-500/20 text-primary-500",
    },
    {
      colorScheme: "primary",
      variant: ["outline"],
      className: "border-primary-500/40 text-primary-500",
    },
    // RED
    {
      colorScheme: ["red"],
      variant: ["solid"],
      className: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
    },
    {
      colorScheme: "red",
      variant: ["ghost", "outline"],
      className: "text-red-500 hover:bg-red-500/10 active:bg-red-500/20",
    },
    {
      colorScheme: "red",
      variant: ["outline"],
      className: "border-red-500/40 text-red-500",
    },
  ],
  defaultVariants: {
    variant: "solid",
    rounded: "xs",
    size: "sm",
    colorScheme: "gray",
  },
})

export const buttonSizeStyles = cva("", {
  variants: {
    size: {
      xs: "h-7",
      sm: "h-9",
      md: "h-11",
      lg: "h-12",
    },
  },
  defaultVariants: {
    size: "sm",
  },
})

export type ButtonStyleProps = VariantProps<typeof buttonStyles>

export type ButtonProps = ButtonStyleProps &
  React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    isLoading?: boolean
    leftIcon?: React.ReactNode
  }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function _Button(
  { variant, leftIcon, rounded, disabled, isLoading, colorScheme, size, ...props },
  ref,
) {
  return (
    <div className={isLoading || disabled ? "cursor-not-allowed" : undefined}>
      <button
        ref={ref}
        type="button"
        disabled={isLoading || !!disabled}
        {...props}
        className={merge(
          buttonStyles({
            size,
            rounded,
            colorScheme,
            disabled: disabled || isLoading,
            variant,
          }),
          buttonSizeStyles({ size }),
          props.className,
        )}
      >
        <div className={join("center", isLoading && "opacity-0")} aria-hidden={isLoading}>
          {leftIcon && <span className="mr-0 md:mr-1">{leftIcon}</span>}
          {props.children}
        </div>
        {isLoading && (
          <div className="center absolute inset-0">
            <Spinner size={size} />
          </div>
        )}
      </button>
    </div>
  )
})
