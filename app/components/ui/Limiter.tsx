import type * as React from "react"

import { cn } from "~/lib/tailwind"

export function Limiter({ className, ...props }: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("w-full px-4 md:px-10 lg:px-24 xl:px-40", className)} />
}
