"use client"
import { join, merge } from "@element/shared"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import * as React from "react"

import { Spinner } from "./Spinner"

export const buttonStyles = cva(
  "rounded-xs flex w-min items-center justify-center whitespace-nowrap border border-transparent font-normal outline-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-gray-500 dark:focus:ring-offset-gray-900",
  {
    variants: {
      size: {
        xs: "px-2 text-xs",
        sm: "px-2 text-sm",
        md: "px-3 text-sm",
        lg: "px-5 text-lg",
      },
      variant: {
        primary:
          "border-transparent bg-gray-900 text-white hover:bg-gray-600 active:bg-gray-500 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:active:bg-white/80",
        brand: "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 border-transparent text-white",
        secondary:
          "border-transparent bg-gray-100 text-black hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:active:bg-gray-500",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
        "destructive-secondary":
          "border-red-500 bg-transparent text-red-600 hover:border-red-600 hover:bg-red-500/10 active:border-red-700",
        outline: "border-black/10 dark:border-white/10",
        ghost: "",
        link: "bg-transparent px-0 text-black hover:underline dark:text-white",
      },
      disabled: {
        true: "relative cursor-not-allowed opacity-70",
      },
    },
    compoundVariants: [
      {
        variant: ["ghost", "outline"],
        className:
          "bg-transparent text-black hover:bg-black/5 active:bg-black/20 dark:text-white dark:hover:bg-white/10 dark:active:bg-white/20",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
)

export const buttonSizeStyles = cva("", {
  variants: {
    size: {
      xs: "h-7",
      sm: "h-8",
      md: "h-9",
      lg: "h-11",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export type ButtonStyleProps = VariantProps<typeof buttonStyles>

export type ButtonProps = ButtonStyleProps &
  React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    isLoading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
  }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function _Button(
  { variant = "primary", leftIcon, rightIcon, disabled, isLoading, size, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={isLoading || !!disabled}
      {...props}
      className={merge(
        buttonStyles({ size, disabled: disabled || isLoading, variant }),
        buttonSizeStyles({ size }),
        props.className,
      )}
    >
      {leftIcon && <span className={join("mr-1.5", isLoading && "opacity-0")}>{leftIcon}</span>}
      {isLoading ? <span className="opacity-0">{props.children}</span> : props.children}
      {rightIcon && <span className={join("ml-1.5", isLoading && "opacity-0")}>{rightIcon}</span>}

      {isLoading && (
        <div className="absolute inset-0 flex w-full items-center justify-center">
          <Spinner size="sm" color={variant === "primary" || variant === "destructive" ? "white" : "black"} />
        </div>
      )}
    </button>
  )
})
