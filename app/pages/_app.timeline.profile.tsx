import type * as React from "react"
import { RiBankCard2Line, RiMap2Line, RiSettings2Line } from "react-icons/ri"
import { NavLink, Outlet, useNavigate, useTransition } from "@remix-run/react"

import { Modal } from "~/components/ui/Modal"
import { transformImage } from "~/lib/helpers/image"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useMe } from "~/pages/_app"
import { Avatar } from "~/components/ui/Avatar"
import { cn } from "~/lib/tailwind"
import { Spinner } from "~/components/ui/Spinner"

export default function Profile() {
  const me = useMe()
  const navigate = useNavigate()
  const { featuresSeen } = useFeaturesSeen()

  return (
    <Modal size="3xl" isOpen={true} onClose={() => navigate("/timeline")}>
      <div className="flex h-full min-h-[600px] overflow-hidden">
        <div className="h-auto w-12 bg-gray-50 dark:bg-gray-800 md:w-52">
          <div className="px-4 py-2">
            <p className="hidden truncate text-xs opacity-80 md:block">{me.email}</p>
          </div>
          <div className="stack space-y-1">
            <TabLink
              to="."
              icon={
                <Avatar
                  src={me.avatar ? transformImage(me.avatar, "w_30,h_30,g_faces") : undefined}
                  name={me.firstName + " " + me.lastName}
                  size="xs"
                />
              }
            >
              Account
            </TabLink>
            <TabLink
              to="settings"
              icon={
                <div className="relative">
                  <RiSettings2Line className="sq-[15px]" />
                  {!featuresSeen.find((u) => ["weather", "habits"].includes(u)) && (
                    <div className="absolute -top-[3px] -right-[3px] rounded-full bg-red-500 sq-[5px]" />
                  )}
                </div>
              }
            >
              Settings
            </TabLink>
            <TabLink to="plan" icon={<RiMap2Line className="sq-[15px]" />}>
              Plan
            </TabLink>
            <TabLink to="billing" icon={<RiBankCard2Line className="sq-[15px]" />}>
              Billing
            </TabLink>
          </div>
        </div>
        <div className="max-h-[600px] w-full overflow-scroll p-4 pb-8">
          <Outlet />
        </div>
      </div>
    </Modal>
  )
}

function TabLink({ children, icon, to }: { to: string; children: string; icon: React.ReactElement<any> | undefined }) {
  const transition = useTransition()

  const isLoading =
    transition.type === "normalLoad" && transition.state === "loading" && transition.location.pathname.includes(to)

  return (
    <NavLink to={to} end={to === "."} className="outline-none" prefetch="render">
      {({ isActive }) => (
        <span
          className={cn(
            "flex h-10 items-center justify-start py-1 pl-4 font-normal",
            isActive ? "bg-gray-75 dark:bg-gray-700" : "hover:bg-gray-75 dark:hover:bg-gray-700",
          )}
        >
          <div className={cn("center md:flex", isLoading && "hidden")}>{icon}</div>
          <span className="ml-2 hidden text-sm md:block">{children}</span>
          {isLoading && <Spinner className="ml-0 md:ml-2" size="xs" />}
        </span>
      )}
    </NavLink>
  )
}
