import { BiMoon, BiSun, BiUser } from "react-icons/bi"
import { RiBookLine, RiLogoutCircleRLine, RiQuestionLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useSubmit } from "@remix-run/react"

import { isMobile } from "~/lib/helpers/utils"
import { NEW_UPDATES, useUpdatesSeen } from "~/lib/hooks/useUpdates"
import type { SidebarElement } from "~/pages/_timeline.index"

import { ElementsSidebar } from "./ElementsSidebar"
import { Modal } from "./Modal"
import { ProfileModal } from "./ProfileModal"
import { ShortcutsInfo } from "./ShortcutsInfo"
import { HEADER_HEIGHT } from "./TimelineHeader"

interface Props {
  elements: SidebarElement[]
}

export function Nav({ elements }: Props) {
  const elementSidebarProps = c.useDisclosure()
  const shortcutModalProps = c.useDisclosure()

  const updatesSeens = useUpdatesSeen((s) => s.updatesSeens)

  const logoutSubmit = useSubmit()

  const profileModalProps = c.useDisclosure()

  c.useEventListener("keydown", (event) => {
    if (event.metaKey && event.key === "e") {
      event.preventDefault()
      elementSidebarProps.onToggle()
    }
  })

  const { colorMode, toggleColorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  const bg = c.useColorModeValue("white", "gray.800")

  const borderColor = c.useColorModeValue("gray.100", "gray.900")

  return (
    <c.Flex
      px={4}
      overflow="hidden"
      flexDir="column"
      pb={isMobile ? "100px" : 6}
      transition="width 80ms"
      align="center"
      position="fixed"
      top={HEADER_HEIGHT}
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
  )
}
