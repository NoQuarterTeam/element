import { merge } from "@element/shared"

type DivProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export function Tile({ children, ...props }: DivProps) {
  return (
    <div {...props} className={merge("w-full border", props.className)}>
      {children}
    </div>
  )
}

export function TileHeader({ children, ...props }: DivProps) {
  return (
    <div {...props} className={merge("flex w-full items-center justify-between px-4 pb-0 pt-4 md:px-6", props.className)}>
      {children}
    </div>
  )
}
export function TileHeading({
  children,
  ...props
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>) {
  return (
    <p {...props} className={merge("text-lg font-semibold", props.className)}>
      {children}
    </p>
  )
}
export function TileBody({ children, ...props }: DivProps) {
  return (
    <div {...props} className={merge("w-full px-4 py-4 md:px-6", props.className)}>
      {children}
    </div>
  )
}

export function TileFooter({ children, ...props }: DivProps) {
  return (
    <div {...props} className={merge("w-full border-t px-4 py-4 text-sm text-gray-400 md:px-6", props.className)}>
      {children}
    </div>
  )
}
