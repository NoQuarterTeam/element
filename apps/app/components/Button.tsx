import * as React from "react"
import { TouchableOpacityProps, TouchableOpacity } from "react-native"
import { merge } from "@element/shared"
import { cva } from "class-variance-authority"
import { Text } from "./Text"

interface Props extends TouchableOpacityProps {
  className?: string
  textClassName?: string
  children: React.ReactNode
  variant?: "primary" | "outline" | "ghost"
}

export const buttonStyles = cva("rounded-sm border px-4 py-3", {
  variants: {
    size: {
      xs: "px-2",
      sm: "px-2",
      md: "px-4",
      lg: "px-5",
    },
    variant: {
      primary: "bg-primary-600 border-primary-600 ",
      outline: "border-gray-100 bg-transparent",
      ghost: "bg-transparent border-transparent",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
})
export const buttonTextStyles = cva("font-heading text-center text-lg", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
    },
    variant: {
      primary: "text-white",
      outline: "text-gray-900",
      ghost: "text-gray-900",
    },
  },
})

export function Button({ variant = "primary", ...props }: Props) {
  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.7}
      className={merge(buttonStyles({ variant, className: props.className }), props.disabled && "opacity-70")}
    >
      <Text className={buttonTextStyles({ variant, className: props.textClassName })}>{props.children}</Text>
    </TouchableOpacity>
  )
}
