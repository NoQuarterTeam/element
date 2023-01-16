import { cva, VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "~/lib/tailwind"

export const avatarStyles = cva("center rounded-full bg-primary-800 text-xs capitalize", {
  variants: {
    size: {
      xs: "sq-[20px]",
      sm: "sq-[30px]",
      md: "sq-[40px]",
      lg: "sq-[50px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export type AvatarProps = VariantProps<typeof avatarStyles>

interface Props extends AvatarProps, React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  src: string | null | undefined
  name: string
}

export function Avatar(props: Props) {
  const initials = props.name
    .split(" ")
    .map((n) => n[0])
    .join("")
  if (!props.src)
    return (
      <div className={cn(avatarStyles({ size: props.size }), props.className)}>
        <p>{initials}</p>
      </div>
    )
  return <img alt="avatar" className={cn(avatarStyles({ size: props.size }), props.className)} />
}
