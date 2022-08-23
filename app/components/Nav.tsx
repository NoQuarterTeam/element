import { BiMoon, BiSun, BiUser } from "react-icons/bi"
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi"
import { RiBookLine, RiLogoutCircleRLine, RiQuestionLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useSubmit } from "@remix-run/react"

import { useStoredDisclosure } from "~/lib/hooks/useStoredDisclosure"
import { NEW_UPDATES, useUpdatesSeen } from "~/lib/hooks/useUpdatesSeen"
import type { SidebarElement } from "~/pages/_timeline.timeline"

import { ElementsSidebar } from "./ElementsSidebar"
import { Modal } from "./Modal"
import { ProfileModal } from "./ProfileModal"
import { ShortcutsInfo } from "./ShortcutsInfo"

interface Props {
  elements: SidebarElement[]
}

export function Nav({ elements }: Props) {
  const elementSidebarProps = c.useDisclosure()
  const shortcutModalProps = c.useDisclosure()
  const navProps = useStoredDisclosure("element.nav", { defaultIsOpen: true })

  const updatesSeens = useUpdatesSeen((s) => s.updatesSeens)

  const logoutSubmit = useSubmit()

  const profileModalProps = c.useDisclosure()

  c.useEventListener("keydown", (event) => {
    if (event.metaKey && event.key === "e") {
      event.preventDefault()
      elementSidebarProps.onToggle()
    }
    if (event.metaKey && event.key === "/") {
      event.preventDefault()
      navProps.onToggle()
    }
    if (event.metaKey && event.key === "k") {
      event.preventDefault()
      shortcutModalProps.onToggle()
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
        bottom={0}
        borderLeft="1px solid"
        borderColor={borderColor}
        bg={bg}
        right={0}
        justify="space-between"
      >
        <c.Box />

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
              icon={<c.Box as={isDark ? BiSun : BiMoon} boxSize="18px" />}
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
                  <c.Box as={BiUser} boxSize="18px" />
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

        <c.Flex position="absolute" top={4} right={0} w="65px" justify="center">
          <c.Fade in={navProps.isOpen}>
            <c.IconButton
              borderRadius="full"
              icon={<c.Box as={FiChevronsRight} boxSize="18px" />}
              aria-label="close nav"
              variant="ghost"
              onClick={navProps.onToggle}
            />
          </c.Fade>
        </c.Flex>

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
        <c.Modal size="xl" {...profileModalProps}>
          <c.ModalOverlay />
          <c.ModalContent>
            <c.ModalCloseButton />
            <ProfileModal />
          </c.ModalContent>
        </c.Modal>
      </c.Flex>
    </>
  )
}
