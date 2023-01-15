import { type NavLinkProps, NavLink as RNavLink } from "@remix-run/react"
import { twMerge } from "tailwind-merge"

export function NavLink(props: NavLinkProps) {
  return (
    <RNavLink
      {...props}
      className={(linkProps) =>
        twMerge(
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
