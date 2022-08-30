import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi"
import {
  // RiBarChartLine,
  RiBookLine,
  RiDashboard3Line,
  RiFocus3Line,
  RiLogoutCircleRLine,
  RiMoonLine,
  RiQuestionLine,
  RiSunLine,
  RiUser3Line,
} from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { Role } from "@prisma/client"
import { useNavigate, useSubmit } from "@remix-run/react"

import { NEW_UPDATES, useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useStoredDisclosure } from "~/lib/hooks/useStoredDisclosure"
import { useMe } from "~/pages/_app"

import { Modal } from "./Modal"
import { ShortcutsInfo } from "./ShortcutsInfo"

export function Nav() {
  const shortcutModalProps = c.useDisclosure()

  const navProps = useStoredDisclosure("element.nav", { defaultIsOpen: true })
  const me = useMe()
  const featuresSeen = useFeaturesSeen((s) => s.featuresSeen)

  const logoutSubmit = useSubmit()
  const navigate = useNavigate()

  c.useEventListener("keydown", (event) => {
    if (event.metaKey && event.key === "k") {
      event.preventDefault()
      navigate("/timeline/focus")
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

  const { colorMode, toggleColorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  const bg = c.useColorModeValue("white", "gray.800")

  const borderColor = c.useColorModeValue("gray.100", "gray.900")

  return (
    <>
      <c.Flex position="absolute" top={4} right={0} w="65px" justify="center">
        <c.Fade in={!navProps.isOpen}>
          <c.IconButton
            borderRadius="full"
            variant="ghost"
            icon={<c.Box as={FiChevronsLeft} boxSize="18px" />}
            aria-label="close sidebar"
            onClick={navProps.onToggle}
          />
        </c.Fade>
      </c.Flex>

      <c.Flex
        overflow="hidden"
        flexDir="column"
        pb={6}
        w={navProps.isOpen ? "65px" : "0px"}
        transition="width 80ms"
        align="center"
        position="fixed"
        top={0}
        pt={4}
        bottom={0}
        borderLeft="1px solid"
        borderColor={borderColor}
        bg={bg}
        right={0}
        justify="space-between"
      >
        <c.VStack spacing={1}>
          <c.IconButton
            borderRadius="full"
            icon={<c.Box as={FiChevronsRight} boxSize="18px" />}
            aria-label="close nav"
            variant="ghost"
            onClick={navProps.onToggle}
          />
        </c.VStack>

        <c.VStack spacing={1}>
          <c.Tooltip label="Elements" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              borderRadius="full"
              variant="ghost"
              aria-label="open element sidebar"
              onClick={() => navigate("elements")}
              icon={<c.Box as={RiBookLine} boxSize="18px" />}
            />
          </c.Tooltip>
          {/* <c.Tooltip label="Dashboard" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              borderRadius="full"
              variant="ghost"
              aria-label="open dashboard"
              onClick={() => navigate("/dashboard")}
              icon={<c.Box as={RiBarChartLine} boxSize="18px" />}
            />
          </c.Tooltip> */}
          <c.Tooltip label="Focus mode" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              borderRadius="full"
              variant="ghost"
              aria-label="open focus mode"
              onClick={() => {
                navigate("focus")
              }}
              icon={
                <c.Box pos="relative">
                  <c.Box as={RiFocus3Line} boxSize="18px" />
                  {!featuresSeen.includes("focus") && (
                    <c.Box boxSize="5px" borderRadius="full" bg="red.500" pos="absolute" top={0} right={0} />
                  )}
                </c.Box>
              }
            />
          </c.Tooltip>
          <c.Tooltip label="Profile" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              borderRadius="full"
              aria-label="Profile"
              variant="ghost"
              onClick={() => navigate("profile")}
              icon={
                <c.Box pos="relative">
                  <c.Box as={RiUser3Line} boxSize="18px" />
                  {featuresSeen.length !== NEW_UPDATES.length && (
                    <c.Box boxSize="5px" borderRadius="full" bg="red.500" pos="absolute" top={0} right={0} />
                  )}
                </c.Box>
              }
            />
          </c.Tooltip>
          <c.Tooltip label="Color mode" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              borderRadius="full"
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              variant="ghost"
              onClick={toggleColorMode}
              icon={<c.Box as={isDark ? RiSunLine : RiMoonLine} boxSize="18px" />}
            />
          </c.Tooltip>

          <c.Tooltip label="Shortcuts" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              borderRadius="full"
              onClick={shortcutModalProps.onOpen}
              aria-label="Shortcuts"
              variant="ghost"
              icon={<c.Box as={RiQuestionLine} boxSize="18px" />}
            />
          </c.Tooltip>
          {me.role === Role.ADMIN && (
            <c.Tooltip label="Admin" placement="auto" zIndex={50} hasArrow>
              <c.IconButton
                borderRadius="full"
                onClick={() => navigate("/admin")}
                aria-label="Admin"
                variant="ghost"
                icon={<c.Box as={RiDashboard3Line} boxSize="18px" />}
              />
            </c.Tooltip>
          )}

          <c.Tooltip label="Logout" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              borderRadius="full"
              variant="ghost"
              aria-label="logout"
              onClick={() => logoutSubmit(null, { method: "post", action: "/logout" })}
              icon={<c.Box as={RiLogoutCircleRLine} boxSize="18px" />}
            />
          </c.Tooltip>
        </c.VStack>

        <Modal title="Shortcuts" {...shortcutModalProps}>
          <ShortcutsInfo />
        </Modal>
      </c.Flex>
    </>
  )
}
