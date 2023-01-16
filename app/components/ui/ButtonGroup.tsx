import { cn } from "~/lib/tailwind"

export function ButtonGroup(props: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("flex items-center justify-end space-x-2", props.className)}>
      {props.children}
    </div>
  )
}
