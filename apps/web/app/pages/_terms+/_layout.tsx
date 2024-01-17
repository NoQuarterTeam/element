import { Outlet } from "@remix-run/react"

export default function Layout() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 py-8">
      <Outlet />
    </div>
  )
}
