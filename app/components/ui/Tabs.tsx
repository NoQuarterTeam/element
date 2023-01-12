import { NavLink as RNavLink, NavLinkProps } from "@remix-run/react"
import clsx from "clsx"

export function TabLink(props: NavLinkProps) {
  return (
    <RNavLink
      {...props}
      className={({ isActive }) =>
        clsx(
          "border-b-2 pb-1 font-body text-lg hover:opacity-70",
          isActive ? "border-pink-400 text-pink-400" : "border-transparent text-white",
          props.className,
        )
      }
    >
      {props.children}
    </RNavLink>
  )
}

export function Tabs(props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
  return (
    <div {...props} className={clsx("hstack space-x-6 border-b border-gray-700", props.className)}>
      {props.children}
    </div>
  )
}
