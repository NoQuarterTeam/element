import type * as React from "react"
import { twMerge } from "tailwind-merge"

export function Limiter({ className, ...props }: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={twMerge("w-full px-4 md:px-10 lg:px-24 xl:px-40", className)} />
}
