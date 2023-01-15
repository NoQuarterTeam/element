import clsx from "clsx"

export function ButtonGroup(props: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={clsx("flex items-center justify-end space-x-2", props.className)}>
      {props.children}
    </div>
  )
}
