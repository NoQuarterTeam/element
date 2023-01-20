import * as React from "react"
import { type VariantProps, cva } from "class-variance-authority"

import { merge } from "~/lib/tailwind"

export const inputStyles = cva(
  "text-md block w-full border text-black dark:text-white placeholder-gray-500 transition-colors focus:border-primary-500 focus:bg-transparent focus:ring-transparent rounded-xs focus:ring-primary-500 ring-0 focus:ring-2",
  {
    variants: {
      variant: {
        solid: "border-transparent bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10",
        outline: "bg-transparent border-black/30 hover:border-black/60 dark:border-white/5 dark:hover:border-white/10",
        ghost: "bg-transparent hover:border-black/10 dark:border-white/5 dark:hover:border-white/10",
      },
      size: {
        xs: "text-xs px-2 py-1",
        sm: "text-sm px-3 py-1.5",
        md: "text-md px-4 py-2",
        lg: "text-lg px-5 py-3",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "sm",
    },
  },
)

export const inputSizeStyles = cva("", {
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

export type InputStyleProps = VariantProps<typeof inputStyles>
export type InputSizeStyleProps = VariantProps<typeof inputSizeStyles>

export interface InputProps
  extends React.AriaAttributes,
    Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "size">,
    InputStyleProps,
    InputSizeStyleProps {
  name?: string
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function _Input({ size, variant, ...props }, ref) {
  return (
    <input
      type="text"
      ref={ref}
      id={props.name}
      {...props}
      className={merge(inputStyles({ variant, size }), inputSizeStyles({ size }), props.className)}
    />
  )
})

export interface TextareaProps
  extends React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>,
    InputStyleProps {
  name?: string
}
export function Textarea({ variant, size, ...props }: TextareaProps) {
  return <textarea id={props.name} {...props} className={merge(inputStyles({ variant, size }), props.className)} />
}

export interface SelectProps
  extends Omit<React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>, "size">,
    InputStyleProps,
    InputSizeStyleProps {
  name?: string
}
export function Select({ variant, size, ...props }: SelectProps) {
  return (
    <select
      id={props.name}
      {...props}
      className={merge(inputStyles({ variant, size }), inputSizeStyles({ size }), props.className)}
    >
      {props.children}
    </select>
  )
}

export function Checkbox(props: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      {...props}
      className={merge(
        "cursor-pointer border-none bg-black/10 text-primary-500 outline-none transition-all checked:bg-primary-500 hover:bg-black/20 hover:text-primary-600 focus:ring-primary-300 dark:border-none dark:bg-white/20 dark:checked:bg-primary-500 dark:hover:bg-white/30 dark:hover:checked:bg-primary-600 dark:focus:ring-primary-300 ",
        props.className,
      )}
    />
  )
}
