import { Role } from "@element/database/types"
import { join, useDisclosure } from "@element/shared"
import { useFetcher, useLocation, useNavigate, useSubmit } from "@remix-run/react"
import {
  Book,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Focus,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  Sun,
  User,
} from "lucide-react"

import { useEventListener } from "~/lib/hooks/useEventListener"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useSelectedElements } from "~/lib/hooks/useSelectedElements"
import { useStoredDisclosure } from "~/lib/hooks/useStoredDisclosure"
import { useMe } from "~/lib/hooks/useUser"

import { useTheme } from "../lib/theme"
import { ShortcutsInfo } from "./ShortcutsInfo"
import { IconButton } from "./ui/IconButton"
import { Modal } from "./ui/Modal"
import { Tooltip } from "./ui/Tooltip"

export function Nav() {
  const shortcutModalProps = useDisclosure()
  const themeFetcher = useFetcher()
  const navProps = useStoredDisclosure("element.nav", { defaultIsOpen: true })
  const me = useMe()
  const featuresSeen = useFeaturesSeen((s) => s.featuresSeen)
  const location = useLocation()
  const logoutSubmit = useSubmit()
  const navigate = useNavigate()

  useEventListener("keydown", (event: KeyboardEvent) => {
    if (location.pathname !== "/timeline") return
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
      <div className="absolute right-0 top-4 flex w-16 justify-center">
        <IconButton
          rounded
          variant="ghost"
          icon={<ChevronsLeft className="sq-4" />}
          aria-label="close sidebar"
          onClick={navProps.onToggle}
        />
      </div>

      <div
        className={join(
          "fixed bottom-0 right-0 top-0 flex flex-col items-center justify-between overflow-hidden border-l border-gray-100 bg-white pb-6 pt-4 transition-[width] duration-100 dark:border-gray-900 dark:bg-gray-800",
          navProps.isOpen ? "w-16" : "w-0",
        )}
      >
        <div className="vstack space-y-1">
          <IconButton
            rounded
            icon={<ChevronsRight className="sq-4" />}
            aria-label="close nav"
            variant="ghost"
            onClick={navProps.onToggle}
          />
          <Tooltip side="left" label="Backlog">
            <IconButton
              rounded
              variant="ghost"
              aria-label="open backlog"
              onClick={() => navigate("backlog")}
              icon={
                <div className="relative">
                  <Clock className="sq-4" />
                  {!featuresSeen.includes("backlog") && <div className="sq-1.5 absolute right-0 top-0 rounded-full bg-red-500" />}
                </div>
              }
            />
          </Tooltip>
          <Tooltip side="left" label="Elements">
            <IconButton
              rounded
              variant="ghost"
              aria-label="open element sidebar"
              onClick={() => navigate("elements")}
              icon={
                <div className="relative">
                  <Book className="sq-4" />
                  {elementIds.length > 0 && <div className="bg-primary-500 sq-2.5 absolute -right-1 -top-1 rounded-full" />}
                </div>
              }
            />
          </Tooltip>
          <Tooltip side="left" label="Focus mode">
            <IconButton
              rounded
              variant="ghost"
              aria-label="open focus mode"
              onClick={() => {
                navigate("focus")
              }}
              icon={
                <div className="relative">
                  <Focus className="sq-4" />
                  {!featuresSeen.includes("focus") && <div className="sq-1.5 absolute right-0 top-0 rounded-full bg-red-500" />}
                </div>
              }
            />
          </Tooltip>
        </div>

        <div className="stack space-y-1">
          {/* <Tooltip side="left" label="Dashboard" >
            <IconButton
              rounded
              variant="ghost"
              aria-label="open dashboard"
              onClick={() => navigate("/dashboard")}
              icon={<RiBarChartLine className="sq-4" />}
            />
          </Tooltip> */}
          <Tooltip side="left" label="Profile">
            <IconButton
              rounded
              aria-label="Profile"
              variant="ghost"
              onClick={() => navigate("profile")}
              icon={
                <div className="relative">
                  <User className="sq-4" />
                  {(!featuresSeen.includes("weather") || !featuresSeen.includes("habits")) && (
                    <div className="sq-1.5 absolute right-0 top-0 rounded-full bg-red-500" />
                  )}
                </div>
              }
            />
          </Tooltip>
          <themeFetcher.Form action="/api/theme" method="post">
            <input type="hidden" name="theme" value={theme === "dark" ? "light" : "dark"} />
            <Tooltip side="left" label="Color mode">
              <IconButton
                type="submit"
                rounded
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                variant="ghost"
                icon={theme === "dark" ? <Sun className="sq-4" /> : <Moon className="sq-4" />}
              />
            </Tooltip>
          </themeFetcher.Form>

          <Tooltip side="left" label="Shortcuts">
            <IconButton
              rounded
              onClick={shortcutModalProps.onOpen}
              aria-label="Shortcuts"
              variant="ghost"
              icon={<HelpCircle className="sq-4" />}
            />
          </Tooltip>
          <Tooltip side="left" label="Give feedback">
            <IconButton
              rounded
              onClick={() => navigate("feedback")}
              aria-label="Give feedback"
              variant="ghost"
              icon={<MessageCircle className="sq-4" />}
            />
          </Tooltip>
          {me.role === Role.ADMIN && (
            <Tooltip side="left" label="Admin">
              <IconButton
                rounded
                onClick={() => navigate("/admin")}
                aria-label="Admin"
                variant="ghost"
                icon={<LayoutDashboard className="sq-4" />}
              />
            </Tooltip>
          )}

          <Tooltip side="left" label="Logout">
            <IconButton
              rounded
              variant="ghost"
              aria-label="logout"
              onClick={() => logoutSubmit(null, { method: "post", action: "/logout" })}
              icon={<LogOut className="sq-4" />}
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
