import type * as React from "react"
import clsx from "clsx"

export function Limiter({ className, ...props }: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("w-full px-4 md:px-10 lg:px-24 xl:px-40", className)} {...props} />
}
