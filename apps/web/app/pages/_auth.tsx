import type { LoaderFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Link, Outlet } from "@remix-run/react"

import { db } from "~/lib/db.server"
import { useTheme } from "~/lib/theme"
import { getUserSession } from "~/services/session/session.server"

export const headers = () => {
  return {
    "Cache-Control": "max-age=3600, s-maxage=86400",
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { userId } = await getUserSession(request)
  if (!userId) return null
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (user) return redirect("/")
  return null
}

export default function AuthLayout() {
  const theme = useTheme()
  const isDark = theme === "dark"
  return (
    <div className="center flex-col pt-10 md:pt-12">
      <div
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 65 65' width='60' height='60' fill='none' stroke='${
            isDark ? "rgb(50 50 50 / 0.1)" : "rgb(15 23 42 / 0.03)"
          }'%3e%3cpath d='M0 .5H63.5V65'/%3e%3c/svg%3e")`,
        }}
        className="absolute inset-0 z-[-10] h-screen"
      />
      <div className="vstack w-full">
        <div className="vstack w-full max-w-sm space-y-8 bg-white p-4 dark:bg-gray-800">
          <Link to="/">
            <img src="/logo.png" alt="logo" className="sq-20" />
          </Link>
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
