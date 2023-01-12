import clsx from "clsx"

export function ButtonGroup({ className, ...props }: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("flex items-center justify-end space-x-4", className)} {...props}>
      {props.children}
    </div>
  )
}
