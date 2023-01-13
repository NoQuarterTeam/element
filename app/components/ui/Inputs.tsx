import type * as React from "react"
import { type VariantProps, cva } from "class-variance-authority"
import clsx from "clsx"

export const inputStyles = cva(
  "text-md block w-full border text-black dark:text-white placeholder-gray-500 transition-colors focus:border-primary-500 focus:bg-transparent focus:ring-transparent rounded-xs focus:ring-primary-500 ring-0 focus:ring-1",
  {
    variants: {
      variant: {
        solid: "border-transparent bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10",
        outline: "bg-transparent border-black/30 hover:border-black/60 dark:border-white/5 dark:hover:border-white/10",
        ghost: "bg-transparent hover:border-black/10 dark:border-white/5 dark:hover:border-white/10",
      },
      size: {
        xs: "text-xs px-2 py-1",
        sm: "text-sm px-3 pt-[6px]",
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
      xs: "h-[30px]",
      sm: "h-[36px]",
      md: "h-[44px]",
      lg: "h-[50px]",
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
export function Input({ size, variant, ...props }: InputProps) {
  return (
    <input
      type="text"
      id={props.name}
      {...props}
      className={clsx(inputStyles({ className: props.className, variant, size }), inputSizeStyles({ size }))}
    />
  )
}

export interface TextareaProps
  extends React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>,
    InputStyleProps {
  name?: string
}
export function Textarea({ variant, size, ...props }: TextareaProps) {
  return <textarea id={props.name} {...props} className={clsx(inputStyles({ className: props.className, variant, size }))} />
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
      className={clsx(inputStyles({ className: props.className, variant, size }), inputSizeStyles({ size }))}
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
      className={clsx(
        "cursor-pointer border-none bg-black/5 text-primary-500 transition-all hover:bg-black/10 hover:text-primary-600 focus:ring-primary-800 dark:bg-white/5 dark:hover:bg-white/10",
        props.className,
      )}
    />
  )
}
