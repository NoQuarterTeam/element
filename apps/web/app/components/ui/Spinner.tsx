import { merge } from "@element/shared"
import { type VariantProps, cva } from "class-variance-authority"
import type * as React from "react"

const spinnerStyles = cva("animate-spin", {
  variants: {
    size: {
      xs: "sq-3",
      sm: "sq-4",
      md: "sq-5",
      lg: "sq-7",
    },
    color: {
      white: "text-white dark:text-black",
      black: "text-black dark:text-white",
    },
  },
  defaultVariants: {
    color: "black",
    size: "md",
  },
})

export type SpinnerStyleProps = VariantProps<typeof spinnerStyles>
export type SpinnerProps = React.SVGProps<SVGSVGElement> & SpinnerStyleProps

export function Spinner({ size, color = "black", ...props }: SpinnerProps) {
  return (
    <svg
      {...props}
      className={merge(spinnerStyles({ size, color }), props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <title>loading</title>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" />
      <path
        className="opacity-100"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
