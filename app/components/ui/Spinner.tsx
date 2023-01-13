import type * as React from "react"
import { type VariantProps, cva } from "class-variance-authority"

const spinnerStyles = cva("animate-spin text-white", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-7 w-7",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export type SpinnerStyleProps = VariantProps<typeof spinnerStyles>
export type SpinnerProps = React.SVGProps<SVGSVGElement> & SpinnerStyleProps

export function Spinner({ size, ...props }: SpinnerProps) {
  return (
    <svg
      {...props}
      className={spinnerStyles({ className: props.className, size })}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}
