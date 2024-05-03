import { type VariantProps, cva } from "class-variance-authority"
import * as React from "react"

import { merge } from "@element/shared"

export const inputStyles = cva(
  "focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500 rounded-xs block w-full border text-base text-black placeholder-gray-500 ring-0 transition-colors placeholder:font-thin focus:bg-transparent focus:ring-2 focus:ring-transparent read-only:focus:ring-transparent dark:text-white",
  {
    variants: {
      variant: {
        solid: "border-transparent bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10",
        outline: "border-black/10 bg-transparent hover:border-black/90 dark:border-white/10 dark:hover:border-white/20",
        ghost: "border-transparent bg-transparent hover:border-black/10 dark:hover:border-white/10",
      },
      size: {
        xs: "px-2 py-1 text-xs",
        sm: "px-3 py-1 text-sm",
        md: "px-4 py-1 text-base",
        lg: "px-5 py-3 text-lg",
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
      sm: "h-8",
      md: "h-9",
      lg: "h-11",
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
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  ref?: React.Ref<HTMLInputElement>
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function _Input(
  { size, variant, leftElement, rightElement, ...props },
  ref,
) {
  return (
    <div className="flex flex-row w-full">
      {leftElement && (
        <div
          className={merge(
            inputSizeStyles({ size }),
            "rounded-l-xs flex items-center justify-center border bg-gray-50 px-2 dark:bg-gray-900",
          )}
        >
          {leftElement}
        </div>
      )}
      <input
        type="text"
        ref={ref}
        id={props.name}
        {...props}
        className={merge(
          inputStyles({ variant, size, className: props.className }),
          inputSizeStyles({ size }),
          leftElement && "rounded-l-none",
          rightElement && "rounded-r-none",
        )}
      />
      {rightElement && (
        <div
          className={merge(
            inputSizeStyles({ size }),
            "rounded-r-xs flex items-center justify-center border bg-gray-50 px-2 dark:bg-gray-900",
          )}
        >
          {rightElement}
        </div>
      )}
    </div>
  )
})

export interface TextareaProps
  extends React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>,
    InputStyleProps {
  name?: string
}

export function Textarea({ variant, size, ...props }: TextareaProps) {
  return <textarea id={props.name} {...props} className={merge(inputStyles({ variant, size }), "resize-none", props.className)} />
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
      className={merge(inputStyles({ variant, size }), inputSizeStyles({ size }), "w-auto pr-8", props.className)}
    >
      {props.children}
    </select>
  )
}

export const checkboxSizeStyles = cva("", {
  variants: {
    size: {
      sm: "sq-4",
      md: "sq-5",
      lg: "sq-7",
    },
  },
  defaultVariants: {
    size: "md",
  },
})
export type CheckboxSizeStyleProps = VariantProps<typeof checkboxSizeStyles>

export function Checkbox({
  size = "md",
  isInderterminate,
  ...props
}: Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "size"> &
  CheckboxSizeStyleProps & { isInderterminate?: boolean }) {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (!ref.current) return
    if (isInderterminate) {
      ref.current.indeterminate = !props.checked && isInderterminate
    }
  }, [isInderterminate, props.checked])

  return (
    <input
      ref={ref}
      type="checkbox"
      {...props}
      className={merge(
        inputStyles({ variant: "outline" }),
        checkboxSizeStyles({ size }),
        "text-primary-500 checked:bg-primary-500 hover:text-primary-600 focus:ring-primary-300 dark:checked:bg-primary-500 dark:hover:checked:bg-primary-600 dark:focus:ring-primary-300 flex-shrink-0 cursor-pointer p-0 transition-all",
        props.className,
      )}
    />
  )
}
