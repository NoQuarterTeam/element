import type * as React from "react"
import { RiBankCard2Line, RiMap2Line, RiSettings2Line } from "react-icons/ri"
import { NavLink, Outlet, useNavigate, useTransition } from "@remix-run/react"

import { Avatar } from "~/components/ui/Avatar"
import { Modal } from "~/components/ui/Modal"
import { Spinner } from "~/components/ui/Spinner"

import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { join } from "~/lib/tailwind"
import { useMe } from "~/pages/_app"
import { transformImageSrc } from "~/components/OptimisedImage"
import { createImageUrl } from "~/lib/s3"

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
                  src={transformImageSrc(createImageUrl(me.avatar), { width: 30, height: 30, fit: "contain" })}
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
                  <RiSettings2Line className="sq-4" />
                  {!featuresSeen.find((u) => ["weather", "habits"].includes(u)) && (
                    <div className="absolute -top-[3px] -right-[3px] rounded-full bg-red-500 sq-1.5" />
                  )}
                </div>
              }
            >
              Settings
            </TabLink>
            <TabLink to="plan" icon={<RiMap2Line className="sq-4" />}>
              Plan
            </TabLink>
            <TabLink to="billing" icon={<RiBankCard2Line className="sq-4" />}>
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
          className={join(
            "flex h-10 items-center justify-center py-1 px-2 font-normal md:justify-start md:px-4",
            isActive ? "bg-gray-75 dark:bg-gray-700" : "hover:bg-gray-75 dark:hover:bg-gray-700",
          )}
        >
          <div className={join("center w-5 md:flex", isLoading && "hidden")}>{icon}</div>
          <span className="ml-2 hidden text-sm md:block">{children}</span>
          {isLoading && <Spinner className="ml-0 md:ml-2" size="xs" />}
        </span>
      )}
    </NavLink>
  )
}
