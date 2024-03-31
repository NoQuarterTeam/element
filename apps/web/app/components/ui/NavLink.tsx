import { merge } from "@element/shared"
import { type NavLinkProps, NavLink as RNavLink } from "@remix-run/react"

export function NavLink(props: NavLinkProps) {
  return (
    <RNavLink
      {...props}
      className={(linkProps) =>
        merge(
          "font-body font-semibold hover:opacity-70",
          linkProps.isActive ? "text-primary-500" : "text-white",
          props.className ? (typeof props.className === "string" ? props.className : props.className(linkProps)) : "",
        )
      }
    >
      {props.children}
    </RNavLink>
  )
}
