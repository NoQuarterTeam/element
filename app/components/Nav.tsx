import * as React from "react"
import { BiMoon, BiPlus, BiSun, BiUser } from "react-icons/bi"
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi"
import { RiBookLine, RiLogoutCircleRLine, RiQuestionLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useTheme } from "@chakra-ui/react"
import { useFetcher, useSubmit } from "@remix-run/react"
import { useQueryClient } from "@tanstack/react-query"

import { transformImage } from "~/lib/helpers/image"
import { isMobile } from "~/lib/helpers/utils"
import { useSelectedTeam } from "~/lib/hooks/useSelectedTeam"
import { useStoredDisclosure } from "~/lib/hooks/useStoredDisclosure"
import { useMe } from "~/pages/_timeline"
import type { SidebarElement, SidebarTeam } from "~/pages/_timeline.index"
import type { TaskElement } from "~/pages/api.task-elements"
import { TeamsActionMethods } from "~/pages/api.teams"
import type { TeamUser } from "~/pages/api.teams.$id.users"

import { ButtonGroup } from "./ButtonGroup"
import { ElementsSidebar } from "./ElementsSidebar"
import { FormField } from "./Form"
import { Modal } from "./Modal"
import { ProfileModal } from "./ProfileModal"
import { ShortcutsInfo } from "./ShortcutsInfo"
import { TeamLogo } from "./TeamLogo"

interface Props {
  teams: SidebarTeam[]
  elements: SidebarElement[]
}

export function Nav({ teams, elements }: Props) {
  const me = useMe()
  const elementSidebarProps = c.useDisclosure()
  const navProps = useStoredDisclosure("element:nav", { defaultIsOpen: true })
  const shortcutModalProps = c.useDisclosure()
  const theme = useTheme()

  const { selectedTeamId, setSelectedTeamId } = useSelectedTeam()
  const logoutSubmit = useSubmit()

  const profileModalProps = c.useDisclosure()

  const createTeamModalProps = c.useDisclosure()
  const createTeamFetcher = useFetcher()
  React.useEffect(() => {
    if (createTeamFetcher.type === "actionReload" && createTeamFetcher.data?.team) {
      setSelectedTeamId(createTeamFetcher.data.team.id)
      createTeamModalProps.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createTeamFetcher.type, createTeamFetcher.data])

  c.useEventListener("keydown", (event) => {
    if (event.metaKey && event.key === "e") {
      event.preventDefault()
      elementSidebarProps.onToggle()
    }
    if (event.metaKey && event.key === "/") {
      event.preventDefault()
      navProps.onToggle()
    }
  })

  // When selected team changes, prefetch the data required for the form
  const client = useQueryClient()
  React.useEffect(() => {
    client.prefetchQuery(["task-elements", { selectedTeamId }], async () => {
      const response = await fetch(`/api/task-elements?selectedTeamId=${selectedTeamId || ""}`)
      if (!response.ok) throw new Error("Network response was not ok")
      return response.json() as Promise<{ elements: TaskElement[] }>
    })
    if (selectedTeamId) {
      client.prefetchQuery(["team-users", { selectedTeamId }], async () => {
        const response = await fetch(`/api/teams/${selectedTeamId}/users`)
        if (!response.ok) throw new Error("Network response was not ok")
        return response.json() as Promise<{ users: TeamUser[] }>
      })
    }
  }, [client, selectedTeamId])
  const { colorMode, toggleColorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  const bg = c.useColorModeValue("white", "gray.800")
  const color = c.useColorModeValue("gray.800", "white")
  const borderColor = c.useColorModeValue("gray.100", "gray.900")

  return (
    <>
      <c.Flex position="absolute" top={2} right={0} w="65px" justify="center">
        <c.Fade in={!navProps.isOpen}>
          <c.IconButton
            icon={<c.Box as={FiChevronsLeft} boxSize="18px" />}
            aria-label="close sidebar"
            variant="ghost"
            onClick={navProps.onToggle}
          />
        </c.Fade>
      </c.Flex>
      <c.Flex
        overflow="hidden"
        flexDir="column"
        pb={isMobile ? "100px" : 6}
        w={navProps.isOpen ? "65px" : "0px"}
        transition="width 80ms"
        align="center"
        position="fixed"
        top={0}
        h="100vh"
        borderLeft="1px solid"
        borderColor={borderColor}
        bg={bg}
        right={0}
        justify="space-between"
        sx={{ "&:hover .team-create-button": { display: "flex" } }}
      >
        <c.VStack spacing={1} pt={12} divider={<c.Divider />}>
          <c.Button
            display="flex"
            borderRadius="full"
            variant="unstyled"
            bg="transparent"
            boxSize="42px"
            onClick={() => setSelectedTeamId("")}
          >
            <c.Avatar
              boxSize="42px"
              color={color}
              border={`3px solid ${!selectedTeamId ? theme.colors.orange[500] : "transparent"}`}
              _hover={{
                borderColor: !selectedTeamId ? theme.colors.orange[500] : theme.colors.orange[300],
              }}
              bg="transparent"
              name={me.firstName + " " + me.lastName}
              src={me.avatar ? transformImage(me.avatar, "w_100,h_100,g_faces") : undefined}
            />
          </c.Button>

          {teams?.map((team) => (
            <TeamLogo key={team.id} team={team} />
          ))}
          <c.Tooltip label="Create team" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              className="team-create-button"
              borderRadius="full"
              variant="outline"
              icon={<c.Box as={BiPlus} />}
              aria-label="create team"
              display="none"
              onClick={createTeamModalProps.onOpen}
            />
          </c.Tooltip>
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
              icon={<c.Box as={isDark ? BiSun : BiMoon} boxSize="18px" />}
            />
          </c.Tooltip>
          <c.Tooltip label="Profile" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              borderRadius="full"
              aria-label="Profile"
              variant="ghost"
              onClick={profileModalProps.onOpen}
              icon={<c.Box as={BiUser} boxSize="18px" />}
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

        <c.Flex position="absolute" top={2} right={0} w="65px" justify="center">
          <c.Fade in={navProps.isOpen}>
            <c.IconButton
              icon={<c.Box as={FiChevronsRight} boxSize="18px" />}
              aria-label="close sidebar"
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
              <ElementsSidebar elements={elements} teams={teams} />
            </c.DrawerContent>
          </c.DrawerOverlay>
        </c.Drawer>
        <Modal title="Create team" {...createTeamModalProps}>
          <createTeamFetcher.Form replace method="post" action="/api/teams">
            <c.Stack spacing={4}>
              <FormField isRequired autoFocus name="name" label="Name" />

              <ButtonGroup>
                <c.Button
                  type="submit"
                  colorScheme="orange"
                  isDisabled={createTeamFetcher.state === "submitting"}
                  isLoading={createTeamFetcher.state === "submitting"}
                  name="_action"
                  value={TeamsActionMethods.CreateTeam}
                >
                  Create
                </c.Button>
              </ButtonGroup>
            </c.Stack>
          </createTeamFetcher.Form>
        </Modal>

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
