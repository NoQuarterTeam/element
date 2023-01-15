import { twMerge } from "tailwind-merge"

export function ButtonGroup(props: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={twMerge("flex items-center justify-end space-x-2", props.className)}>
      {props.children}
    </div>
  )
}
