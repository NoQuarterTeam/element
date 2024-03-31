import type { NavLinkProps } from "@remix-run/react"
import { Link, NavLink, Outlet } from "@remix-run/react"
import { GaugeCircle, type LucideIcon, MessageCircle, Moon, Sun, User } from "lucide-react"

import { merge } from "@element/shared"

import { buttonSizeStyles, buttonStyles } from "~/components/ui/Button"
import { useTheme } from "~/lib/theme"

import { type LoaderFunctionArgs, json, redirect } from "@remix-run/node"
import { useFetcher } from "~/components/ui/Form"
import { getCurrentUser } from "~/services/auth/auth.server"

export const shouldRevalidate = () => false

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request, { role: true })
  if (user.role !== "ADMIN") return redirect("/")
  return json(null)
}

export default function AdminLayout() {
  const themeFetcher = useFetcher()
  const isDark = useTheme() === "dark"
  return (
    <div className="bg-background flex min-h-screen">
      <div className="fixed left-0 top-0 flex h-screen w-[50px] flex-col justify-between border-r px-0 pb-10 md:w-[200px] md:px-4">
        <div className="flex flex-col space-y-2 py-8">
          <Link to="/" className="w-full pl-0 text-center text-lg md:pl-3 md:text-left">
            <span className="hidden md:block">Element</span>
            <span className="block md:hidden">E</span>
          </Link>
          <AdminLink Icon={GaugeCircle} end to="/admin">
            Dashboard
          </AdminLink>
          <AdminLink Icon={User} to="users">
            Users
          </AdminLink>
          <AdminLink Icon={MessageCircle} to="feedback">
            Feedback
          </AdminLink>
        </div>
        <div className="space-y-2">
          <themeFetcher.Form method="post" action="/api/theme" className="w-full">
            <input type="hidden" name="theme" value={isDark ? "light" : "dark"} />
            <themeFetcher.FormButton variant="ghost" className="w-full justify-center space-x-2 md:justify-start">
              {isDark ? <Sun className="sq-4" /> : <Moon className="sq-4" />}
              <span className="hidden md:block">{isDark ? "Light" : "Dark"} mode</span>
            </themeFetcher.FormButton>
          </themeFetcher.Form>
        </div>
      </div>
      <div className="w-full pl-[50px] md:pl-[200px]">
        <div className="px-4 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function AdminLink({ to, children, Icon, ...props }: NavLinkProps & { children: React.ReactNode; Icon: LucideIcon }) {
  return (
    <NavLink
      {...props}
      to={to}
      className={({ isActive }) =>
        merge(
          buttonStyles({ variant: isActive ? "outline" : "ghost" }),
          buttonSizeStyles(),
          "w-full justify-center space-x-2 md:justify-start",
        )
      }
    >
      <Icon size={16} />
      <p className="hidden md:block">{children}</p>
    </NavLink>
  )
}
