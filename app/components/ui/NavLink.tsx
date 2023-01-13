import { type NavLinkProps, NavLink as RNavLink } from "@remix-run/react"
import clsx from "clsx"

export function NavLink(props: NavLinkProps) {
  return (
    <RNavLink
      {...props}
      className={(linkProps) =>
        clsx(
          "font-body font-semibold hover:opacity-70",
          linkProps.isActive ? "text-pink-400" : "text-white",
          props.className ? (typeof props.className === "string" ? props.className : props.className(linkProps)) : "",
        )
      }
    >
      {props.children}
    </RNavLink>
  )
}
