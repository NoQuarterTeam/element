import { BiMessage } from "react-icons/bi"
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi"
import {
  RiBookLine,
  RiDashboard3Line,
  RiFocus3Line,
  RiLogoutCircleRLine,
  RiMoonLine,
  RiQuestionLine,
  RiSunLine,
  RiTimeLine,
  RiUser3Line,
} from "react-icons/ri"
import { Role } from "@prisma/client"
import { useFetcher, useNavigate, useSubmit } from "@remix-run/react"

import { useEventListener } from "~/lib/hooks/useEventListener"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useSelectedElements } from "~/lib/hooks/useSelectedElements"
import { useStoredDisclosure } from "~/lib/hooks/useStoredDisclosure"
import { cn } from "~/lib/tailwind"
import { useMe } from "~/pages/_app"

import { useTheme } from "../lib/theme"
import { ShortcutsInfo } from "./ShortcutsInfo"
import { IconButton } from "./ui/IconButton"
import { Modal } from "./ui/Modal"
import { useDisclosure } from "~/lib/hooks/useDisclosure"
import { Tooltip } from "./ui/Tooltip"

export function Nav() {
  const shortcutModalProps = useDisclosure()
  const themeFetcher = useFetcher()
  const navProps = useStoredDisclosure("element.nav", { defaultIsOpen: true })
  const me = useMe()
  const featuresSeen = useFeaturesSeen((s) => s.featuresSeen)

  const logoutSubmit = useSubmit()
  const navigate = useNavigate()

  useEventListener("keydown", (event: KeyboardEvent) => {
    if (event.metaKey && event.key === "k") {
      event.preventDefault()
      navigate("/timeline/focus")
    }
    if (event.metaKey && event.key === "b") {
      event.preventDefault()
      navigate("/timeline/backlog")
    }
    if (event.metaKey && event.key === "e") {
      event.preventDefault()
      navigate("/timeline/elements")
    }
    if (event.metaKey && event.key === "\\") {
      event.preventDefault()
      navProps.onToggle()
    }
  })

  const theme = useTheme()

  const elementIds = useSelectedElements((s) => s.elementIds)
  return (
    <>
      <div className="absolute top-4 right-0 flex w-16 justify-center">
        <IconButton
          rounded="full"
          variant="ghost"
          icon={<FiChevronsLeft className="sq-4" />}
          aria-label="close sidebar"
          onClick={navProps.onToggle}
        />
      </div>

      <div
        className={cn(
          "fixed top-0 bottom-0 right-0 flex flex-col items-center justify-between overflow-hidden border-l border-gray-100 bg-white pb-6 pt-4 transition-[width] duration-100 dark:border-gray-900 dark:bg-gray-800",
          navProps.isOpen ? "w-16" : "w-0",
        )}
      >
        <div className="vstack space-y-1">
          <IconButton
            rounded="full"
            icon={<FiChevronsRight className="sq-4" />}
            aria-label="close nav"
            variant="ghost"
            onClick={navProps.onToggle}
          />
          <Tooltip side="left" label="Backlog">
            <IconButton
              rounded="full"
              variant="ghost"
              aria-label="open backlog"
              onClick={() => navigate("backlog")}
              icon={
                <div className="relative">
                  <RiTimeLine className="sq-4" />
                  {!featuresSeen.includes("backlog") && <div className="absolute top-0 right-0 rounded-full bg-red-500 sq-1.5" />}
                </div>
              }
            />
          </Tooltip>
          <Tooltip side="left" label="Elements">
            <IconButton
              rounded="full"
              variant="ghost"
              aria-label="open element sidebar"
              onClick={() => navigate("elements")}
              icon={
                <div className="relative">
                  <RiBookLine className="sq-4" />
                  {elementIds.length > 0 && <div className="absolute -top-1 -right-1 rounded-full bg-primary-500 sq-2.5" />}
                </div>
              }
            />
          </Tooltip>
          <Tooltip side="left" label="Focus mode">
            <IconButton
              rounded="full"
              variant="ghost"
              aria-label="open focus mode"
              onClick={() => {
                navigate("focus")
              }}
              icon={
                <div className="relative">
                  <RiFocus3Line className="sq-4" />
                  {!featuresSeen.includes("focus") && <div className="absolute top-0 right-0 rounded-full bg-red-500 sq-1.5" />}
                </div>
              }
            />
          </Tooltip>
        </div>

        <div className="stack space-y-1">
          {/* <Tooltip side="left" label="Dashboard" >
            <IconButton
              rounded="full"
              variant="ghost"
              aria-label="open dashboard"
              onClick={() => navigate("/dashboard")}
              icon={<RiBarChartLine className="sq-4" />}
            />
          </Tooltip> */}
          <Tooltip side="left" label="Profile">
            <IconButton
              rounded="full"
              aria-label="Profile"
              variant="ghost"
              onClick={() => navigate("profile")}
              icon={
                <div className="relative">
                  <RiUser3Line className="sq-4" />
                  {(!featuresSeen.includes("backlog") || !featuresSeen.includes("habits")) && (
                    <div className="absolute top-0 right-0 rounded-full bg-red-500 sq-1.5" />
                  )}
                </div>
              }
            />
          </Tooltip>
          <themeFetcher.Form action="/api/theme" method="post" replace>
            <input type="hidden" name="theme" value={theme === "dark" ? "light" : "dark"} />
            <Tooltip side="left" label="Color mode">
              <IconButton
                type="submit"
                rounded="full"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                variant="ghost"
                icon={theme === "dark" ? <RiSunLine className="sq-4" /> : <RiMoonLine className="sq-4" />}
              />
            </Tooltip>
          </themeFetcher.Form>

          <Tooltip side="left" label="Shortcuts">
            <IconButton
              rounded="full"
              onClick={shortcutModalProps.onOpen}
              aria-label="Shortcuts"
              variant="ghost"
              icon={<RiQuestionLine className="sq-4" />}
            />
          </Tooltip>
          <Tooltip side="left" label="Give feedback">
            <IconButton
              rounded="full"
              onClick={() => navigate("feedback")}
              aria-label="Give feedback"
              variant="ghost"
              icon={<BiMessage className="sq-4" />}
            />
          </Tooltip>
          {me.role === Role.ADMIN && (
            <Tooltip side="left" label="Admin">
              <IconButton
                rounded="full"
                onClick={() => navigate("/admin")}
                aria-label="Admin"
                variant="ghost"
                icon={<RiDashboard3Line className="sq-4" />}
              />
            </Tooltip>
          )}

          <Tooltip side="left" label="Logout">
            <IconButton
              rounded="full"
              variant="ghost"
              aria-label="logout"
              onClick={() => logoutSubmit(null, { method: "post", action: "/logout" })}
              icon={<RiLogoutCircleRLine className="sq-4" />}
            />
          </Tooltip>
        </div>

        <Modal position="center" title="Shortcuts" {...shortcutModalProps}>
          <ShortcutsInfo />
        </Modal>
      </div>
    </>
  )
}
