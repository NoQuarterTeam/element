import { type VariantProps, cva } from "class-variance-authority"
import * as React from "react"
import { ActivityIndicator, TouchableOpacity, type TouchableOpacityProps, View, useColorScheme } from "react-native"

import { join, merge } from "@element/shared"

import { Text } from "./Text"

export const buttonStyles = cva("rounded-xs flex flex-row items-center justify-center border", {
  variants: {
    size: {
      xs: "h-9 px-2",
      sm: "h-8 px-3",
      md: "h-10 px-3",
      lg: "h-12 px-4",
    },
    variant: {
      primary: "border-transparent bg-gray-900 dark:bg-white",
      secondary: "border-transparent bg-gray-100 dark:bg-gray-800",
      destructive: "border-transparent bg-red-500",
      outline: "border-gray-100 dark:border-gray-700",
      ghost: "border-transparent",
      link: "border-transparent",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
})
export const buttonTextStyles = cva("font-500 text-md text-center", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
    variant: {
      primary: "text-white dark:text-black",
      secondary: "text-black dark:text-white",
      destructive: "text-white",
      outline: "",
      ghost: "",
      link: "underline",
    },
  },
})
export type ButtonStyleProps = VariantProps<typeof buttonStyles>

export interface ButtonProps extends TouchableOpacityProps, ButtonStyleProps {
  className?: string
  textClassName?: string
  children: React.ReactNode
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef(function _Button(
  { variant = "primary", leftIcon, rightIcon, size = "md", isLoading, ...props }: ButtonProps,
  ref,
) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  return (
    <TouchableOpacity
      ref={ref as React.LegacyRef<TouchableOpacity>}
      {...props}
      disabled={props.disabled || isLoading}
      activeOpacity={0.7}
      className={merge(
        buttonStyles({ variant, size }),
        isLoading && "opacity-70",
        props.disabled && "opacity-60",
        size === "sm" || size === "xs" ? "gap-1" : "gap-2",
        props.className,
      )}
    >
      {leftIcon && <View className={join(isLoading && "opacity-0")}>{leftIcon}</View>}
      <Text
        className={buttonTextStyles({
          variant,
          size,
          className: join(props.textClassName, isLoading && "opacity-0"),
        })}
      >
        {props.children}
      </Text>

      {isLoading && (
        <View className="absolute">
          <ActivityIndicator
            color={
              variant === "primary" ? (isDark ? "#000" : "#fff") : variant === "destructive" ? "#fff" : isDark ? "#fff" : "#000"
            }
          />
        </View>
      )}
      {rightIcon && <View className={join(isLoading && "opacity-0")}>{rightIcon}</View>}
    </TouchableOpacity>
  )
})
