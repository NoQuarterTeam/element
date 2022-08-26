import * as React from "react"
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi"
import {
  RiBookLine,
  RiDashboard3Line,
  RiLogoutCircleRLine,
  RiMoonLine,
  RiQuestionLine,
  RiSunLine,
  RiUser3Line,
} from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { Role } from "@prisma/client"
import { useNavigate, useSearchParams, useSubmit } from "@remix-run/react"

import { useStoredDisclosure } from "~/lib/hooks/useStoredDisclosure"
import { NEW_UPDATES, useUpdatesSeen } from "~/lib/hooks/useUpdatesSeen"
import { useMe } from "~/pages/_timeline"
import type { SidebarElement } from "~/pages/_timeline.timeline"

import { ElementsSidebar } from "./ElementsSidebar"
import { Modal } from "./Modal"
import { Plan, ProfileModal } from "./ProfileModal"
import { ShortcutsInfo } from "./ShortcutsInfo"

interface Props {
  elements: SidebarElement[]
}

export function Nav({ elements }: Props) {
  const elementSidebarProps = c.useDisclosure()
  const shortcutModalProps = c.useDisclosure()
  const [searchParams, setSearchParams] = useSearchParams()
  const isLimitReached = searchParams.has("limitReached")
  const planLimitModalProps = c.useDisclosure()
  React.useEffect(() => {
    if (isLimitReached) {
      planLimitModalProps.onOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLimitReached])

  const navProps = useStoredDisclosure("element.nav", { defaultIsOpen: true })
  const me = useMe()
  const updatesSeens = useUpdatesSeen((s) => s.updatesSeens)

  const logoutSubmit = useSubmit()
  const navigate = useNavigate()
  const profileModalProps = c.useDisclosure({ defaultIsOpen: false })

  c.useEventListener("keydown", (event) => {
    if (event.metaKey && event.key === "e") {
      event.preventDefault()
      elementSidebarProps.onToggle()
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
              onClick={elementSidebarProps.onOpen}
              icon={<c.Box as={RiBookLine} boxSize="18px" />}
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
          <c.Tooltip label="Profile" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              borderRadius="full"
              aria-label="Profile"
              variant="ghost"
              onClick={profileModalProps.onOpen}
              icon={
                <c.Box pos="relative">
                  <c.Box as={RiUser3Line} boxSize="18px" />
                  {updatesSeens.length !== NEW_UPDATES.length && (
                    <c.Box boxSize="5px" borderRadius="full" bg="red.500" pos="absolute" top={0} right={0} />
                  )}
                </c.Box>
              }
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

        <c.Drawer {...elementSidebarProps} placement="right">
          <c.DrawerOverlay>
            <c.DrawerContent>
              <c.DrawerCloseButton />
              <c.DrawerHeader>Elements</c.DrawerHeader>
              <ElementsSidebar elements={elements} />
            </c.DrawerContent>
          </c.DrawerOverlay>
        </c.Drawer>

        <Modal title="Shortcuts" {...shortcutModalProps}>
          <ShortcutsInfo />
        </Modal>
        <c.Modal size="3xl" {...profileModalProps}>
          <c.ModalOverlay />
          <c.ModalContent>
            <ProfileModal />
          </c.ModalContent>
        </c.Modal>
        <c.Modal
          size="4xl"
          {...planLimitModalProps}
          onClose={() => {
            planLimitModalProps.onClose()
            setSearchParams({})
          }}
        >
          <c.ModalOverlay />
          <c.ModalContent>
            <c.ModalCloseButton />
            <c.ModalBody py={4} pb={8}>
              <c.Stack spacing={4}>
                <c.Heading>Plan limit reached</c.Heading>
                <c.Text>
                  Thank you for using Element, you've reached the limit of the Personal plan. To add more
                  elements or tasks, please upgrade to Pro.
                </c.Text>
                <Plan />
              </c.Stack>
            </c.ModalBody>
          </c.ModalContent>
        </c.Modal>
      </c.Flex>
    </>
  )
}
