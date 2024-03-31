import { createImageUrl, join } from "@element/shared"
import { NavLink, Outlet, useNavigate, useNavigation } from "@remix-run/react"
import { CreditCard, Map, Settings } from "lucide-react"
import type * as React from "react"

import { Avatar } from "~/components/ui/Avatar"
import { Modal } from "~/components/ui/Modal"
import { Spinner } from "~/components/ui/Spinner"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useMe } from "~/lib/hooks/useUser"

export default function Profile() {
  const me = useMe()
  const navigate = useNavigate()
  const { featuresSeen } = useFeaturesSeen()

  return (
    <Modal size="3xl" className="p-0" isOpen={true} onClose={() => navigate("/timeline")}>
      <div className="flex h-full min-h-[600px] overflow-hidden">
        <div className="h-auto w-12 bg-gray-50 dark:bg-gray-800 md:w-52">
          <div className="px-4 py-2">
            <p className="hidden truncate text-xs opacity-80 md:block">{me.email}</p>
          </div>
          <div className="space-y-1">
            <TabLink to="." icon={<Avatar src={createImageUrl(me.avatar)} className="sq-4" size={20} />}>
              Account
            </TabLink>
            <TabLink
              to="settings"
              icon={
                <div className="relative">
                  <Settings className="sq-4" />
                  {!featuresSeen.find((u) => ["weather", "habits"].includes(u)) && (
                    <div className="sq-1.5 absolute -right-[3px] -top-[3px] rounded-full bg-red-500" />
                  )}
                </div>
              }
            >
              Settings
            </TabLink>
            <TabLink to="plan" icon={<Map className="sq-4" />}>
              Plan
            </TabLink>
            <TabLink to="billing" icon={<CreditCard className="sq-4" />}>
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

function TabLink({ children, icon, to }: { to: string; children: string; icon: React.ReactElement<unknown> | undefined }) {
  const navigation = useNavigation()

  const isLoading = navigation.state === "loading" && !navigation.formData && navigation.location.pathname.includes(to)

  return (
    <NavLink to={to} end={to === "."} className="outline-none" prefetch="render">
      {({ isActive }) => (
        <span
          className={join(
            "flex h-10 items-center justify-center px-2 py-1 font-normal md:justify-start md:px-4",
            isActive ? "bg-gray-75 dark:bg-gray-700" : "hover:bg-gray-75 dark:hover:bg-gray-700",
          )}
        >
          <div className={join("flex w-5 items-center justify-center md:flex", isLoading && "hidden")}>{icon}</div>
          <span className="ml-2 hidden text-sm md:block">{children}</span>
          {isLoading && <Spinner className="ml-0 md:ml-2" size="xs" />}
        </span>
      )}
    </NavLink>
  )
}
