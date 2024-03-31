import { merge } from "@element/shared"
import { type VariantProps, cva } from "class-variance-authority"
import type * as React from "react"

export const badgeProps = cva("rounded-xs inline-block whitespace-nowrap border font-medium uppercase", {
  variants: {
    colorScheme: {
      orange:
        "dark:color-orange-200 border-orange-800/30 bg-orange-300/40 text-orange-900 dark:border-orange-300/40 dark:bg-orange-300/20 dark:text-orange-200",

      gray: "border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50",
      red: "dark:color-red-200 border-red-800/30 bg-red-300/40 text-red-900 dark:border-red-300/40 dark:bg-red-300/20 dark:text-red-200",
      green:
        "border-green-800/20 bg-green-300/40 text-green-900 dark:border-green-300/40 dark:bg-green-300/20 dark:text-green-200",
    },
    size: {
      xs: "px-1 py-px text-xs",
      sm: "px-1 py-0.5 text-sm",
      md: "px-2 py-1 text-base",
      lg: "px-2.5 py-1 text-lg",
    },
  },
  defaultVariants: {
    size: "md",
    colorScheme: "gray",
  },
})

export type BadgeStyleProps = VariantProps<typeof badgeProps>

interface Props extends BadgeStyleProps, React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

export function Badge({ size, colorScheme, ...props }: Props) {
  return (
    <p {...props} className={merge(badgeProps({ size, colorScheme }), props.className)}>
      {props.children}
    </p>
  )
}
