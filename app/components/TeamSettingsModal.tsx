import * as React from "react"
import { FiSettings, FiUsers } from "react-icons/fi"
import * as c from "@chakra-ui/react"
import { useFetcher } from "@remix-run/react"

import { shallowEqual } from "~/lib/form"
import { transformImage } from "~/lib/helpers/image"
import { useSelectedTeam } from "~/lib/hooks/useSelectedTeam"
import type { SidebarTeam } from "~/pages/_timeline.index"
import type { Team } from "~/pages/api.teams.$id"
import { TeamActionMethods } from "~/pages/api.teams.$id"

import { ButtonGroup } from "./ButtonGroup"
import { FormError, FormField, ImageField, InlineFormField } from "./Form"
import { Modal } from "./Modal"

export const teamSelectFields = {
  id: true,
  name: true,
  logo: true,
  slug: true,
  isPublic: true,
  users: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
    },
  },
}

interface Props {
  team: SidebarTeam
}
export function TeamSettingsModal({ team: { name, id, logo } }: Props) {
  const { selectedTeamId, setSelectedTeamId } = useSelectedTeam()
  const [tab, setTab] = React.useState<"account" | "settings" | "members">("account")

  const teamFetcher = useFetcher<{ team: Team }>()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadTeam = React.useCallback(() => teamFetcher.load(`/api/teams/${id}`), [id])
  React.useEffect(() => {
    loadTeam()
  }, [loadTeam])

  const [isDirty, setIsDirty] = React.useState(false)
  const formRef = React.useRef<HTMLFormElement>(null)

  const updateProfileFetcher = useFetcher()

  React.useEffect(() => {
    if (updateProfileFetcher.type === "actionReload" && updateProfileFetcher.data?.team) {
      setIsDirty(false)
    }
  }, [updateProfileFetcher.type, updateProfileFetcher.data])

  const alertProps = c.useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const deleteTeamFetcher = useFetcher()
  React.useEffect(() => {
    if (
      deleteTeamFetcher.type === "actionReload" &&
      deleteTeamFetcher.data?.success &&
      selectedTeamId === id
    ) {
      setSelectedTeamId("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteTeamFetcher.type, deleteTeamFetcher.data, selectedTeamId, id])

  const leaveTeamFetcher = useFetcher()
  React.useEffect(() => {
    if (leaveTeamFetcher.type === "actionReload" && leaveTeamFetcher.data?.team && selectedTeamId === id) {
      setSelectedTeamId("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveTeamFetcher.type, leaveTeamFetcher.data, selectedTeamId, id])

  const inviteModalProps = c.useDisclosure()

  const inviteFetcher = useFetcher()
  React.useEffect(() => {
    if (inviteFetcher.type === "actionReload" && inviteFetcher.data?.team) {
      inviteModalProps.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteFetcher.type, inviteFetcher.data])

  const team = teamFetcher.data?.team

  const borderColor = c.useColorModeValue("gray.200", "gray.500")
  const bg = c.useColorModeValue("gray.50", "gray.800")
  const color = c.useColorModeValue("gray.400", "gray.500")

  return (
    <c.Flex minH={400} h="100%" overflow="hidden" borderRadius="md">
      <c.Box minW={140} w="min-content" h="auto" bg={bg}>
        <c.Stack spacing={0}>
          <c.Text fontSize="0.7rem" color={color} py={2} px={4}>
            {name}
          </c.Text>
          <c.Button
            justifyContent="flex-start"
            pl={4}
            variant={tab === "account" ? "solid" : "ghost"}
            fontWeight={400}
            fontSize="0.8rem"
            leftIcon={
              <c.Avatar
                src={logo ? transformImage(logo, "w_30,h_30") : undefined}
                name={name}
                size="xs"
                boxSize="15px"
              />
            }
            borderRadius={0}
            onClick={() => setTab("account")}
          >
            Account
          </c.Button>
          <c.Button
            justifyContent="flex-start"
            pl={4}
            leftIcon={<c.Box as={FiUsers} boxSize="15px" />}
            variant={tab === "members" ? "solid" : "ghost"}
            fontWeight={400}
            fontSize="0.8rem"
            borderRadius={0}
            onClick={() => setTab("members")}
          >
            Members
          </c.Button>
          <c.Button
            justifyContent="flex-start"
            pl={4}
            leftIcon={<c.Box as={FiSettings} boxSize="15px" />}
            variant={tab === "settings" ? "solid" : "ghost"}
            fontWeight={400}
            fontSize="0.8rem"
            borderRadius={0}
            onClick={() => setTab("settings")}
          >
            Settings
          </c.Button>
        </c.Stack>
      </c.Box>
      <c.Box p={4} w="100%">
        {team && (
          <>
            {tab === "account" ? (
              <c.Stack spacing={6} pb={6}>
                <c.Text fontSize="1.3rem" fontWeight={500}>
                  Account
                </c.Text>
                <updateProfileFetcher.Form
                  ref={formRef}
                  action={`/api/teams/${id}`}
                  method="post"
                  replace
                  onChange={(e) => {
                    const formData = new FormData(e.currentTarget)
                    const data = Object.fromEntries(formData) as Record<string, string>
                    const { name, logo } = team
                    const isDirty = !shallowEqual({ name, logo }, data)
                    setIsDirty(isDirty)
                  }}
                >
                  <c.Stack spacing={4}>
                    <FormField
                      error={updateProfileFetcher.data?.fieldErrors?.name?.[0]}
                      defaultValue={team.name}
                      isRequired
                      name="name"
                      label="Name"
                    />
                    <FormField
                      error={updateProfileFetcher.data?.fieldErrors?.slug?.[0]}
                      defaultValue={team.slug}
                      name="slug"
                      isRequired
                      label="Slug"
                    />
                    <FormField
                      error={updateProfileFetcher.data?.fieldErrors?.isPublic?.[0]}
                      defaultChecked={team.isPublic}
                      name="isPublic"
                      label="Is public?"
                      input={<c.Checkbox />}
                    />
                    <ImageField
                      name="logo"
                      error={updateProfileFetcher.data?.fieldErrors?.logo?.[0]}
                      defaultValue={team.logo}
                      boxSize="100px"
                      path={`/teams/${id}/logo`}
                      label="Logo"
                    />
                    <FormError error={updateProfileFetcher.data?.formError} />
                    <ButtonGroup>
                      {isDirty && (
                        <c.Button
                          variant="ghost"
                          onClick={() => {
                            formRef.current?.reset()
                            setIsDirty(false)
                          }}
                        >
                          Cancel
                        </c.Button>
                      )}
                      <c.Button
                        type="submit"
                        colorScheme="orange"
                        name="_action"
                        value={TeamActionMethods.UpdateTeam}
                        isDisabled={!isDirty || updateProfileFetcher.state === "submitting"}
                        isLoading={updateProfileFetcher.state === "submitting"}
                      >
                        Save
                      </c.Button>
                    </ButtonGroup>
                  </c.Stack>
                </updateProfileFetcher.Form>
              </c.Stack>
            ) : tab === "members" ? (
              <c.Box>
                <c.Text fontSize="1.3rem" fontWeight={500} mb={4}>
                  Members
                </c.Text>
                <c.Button mb={2} size="xs" colorScheme="orange" onClick={inviteModalProps.onOpen}>
                  Invite member
                </c.Button>
                <c.Stack divider={<c.Divider />}>
                  <c.Box />
                  {team?.users.map((user) => (
                    <c.Flex key={user.id} align="center" mb={1}>
                      <c.Flex
                        align="center"
                        justify="center"
                        mr={1}
                        border={user.avatar ? undefined : "1px solid"}
                        borderColor={borderColor}
                        borderRadius="full"
                        boxSize="32px"
                        backgroundImage={
                          user.avatar
                            ? `url(${transformImage(user.avatar, "w_100,h_100,g_faces")})`
                            : undefined
                        }
                        backgroundPosition="center"
                        backgroundRepeat="no-repeat"
                        backgroundSize="36px"
                      >
                        {!user.avatar && (
                          <c.Text lineHeight="normal" fontSize="0.6rem">
                            {user.firstName[0]}
                          </c.Text>
                        )}
                      </c.Flex>
                      <c.Box ml={2}>
                        <c.Text fontSize="0.8rem" fontWeight={500}>
                          {user.firstName} {user.lastName}
                        </c.Text>
                        <c.Text fontSize="0.6rem">{user.email}</c.Text>
                      </c.Box>
                    </c.Flex>
                  ))}
                  <c.Box />
                </c.Stack>
                <Modal title="Invite member" {...inviteModalProps}>
                  <inviteFetcher.Form replace method="post" action={`/api/teams/${id}`}>
                    <c.Stack spacing={4}>
                      <InlineFormField
                        error={inviteFetcher.data?.fieldErrors?.email?.[0]}
                        isRequired
                        autoFocus
                        name="email"
                        label="Email"
                      />
                      <FormError error={inviteFetcher.data?.formError} />
                      <ButtonGroup>
                        <c.Button
                          variant="ghost"
                          isDisabled={inviteFetcher.state === "submitting"}
                          onClick={inviteModalProps.onClose}
                        >
                          Cancel
                        </c.Button>
                        <c.Button
                          type="submit"
                          name="_action"
                          value={TeamActionMethods.InviteMember}
                          colorScheme="orange"
                          isDisabled={inviteFetcher.state === "submitting"}
                          isLoading={inviteFetcher.state === "submitting"}
                        >
                          Invite
                        </c.Button>
                      </ButtonGroup>
                    </c.Stack>
                  </inviteFetcher.Form>
                </Modal>
              </c.Box>
            ) : (
              <c.Stack spacing={4} pb={6}>
                <c.Text fontSize="lg" fontWeight={500}>
                  Settings
                </c.Text>

                <c.Text fontSize="xs">Leave the team, all tasks and elements will remain.</c.Text>
                <leaveTeamFetcher.Form action={`/api/teams/${id}`} method="post" replace>
                  <c.Button
                    w="100%"
                    type="submit"
                    variant="outline"
                    name="_action"
                    value={TeamActionMethods.LeaveTeam}
                    isLoading={leaveTeamFetcher.state === "submitting"}
                    isDisabled={leaveTeamFetcher.state === "submitting"}
                  >
                    Leave team
                  </c.Button>
                </leaveTeamFetcher.Form>
                <c.Text fontSize="xs">
                  Permanently delete this team and all of its content. This action is not reversible - please
                  continue with caution.
                </c.Text>

                <c.Button variant="outline" colorScheme="red" onClick={alertProps.onOpen}>
                  Delete team
                </c.Button>

                <c.AlertDialog
                  {...alertProps}
                  motionPreset="slideInBottom"
                  isCentered
                  leastDestructiveRef={cancelRef}
                >
                  <c.AlertDialogOverlay>
                    <c.AlertDialogContent>
                      <c.AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Delete account
                      </c.AlertDialogHeader>
                      <c.AlertDialogBody>
                        Are you sure? You can't undo this action afterwards.
                      </c.AlertDialogBody>
                      <c.AlertDialogFooter>
                        <c.Button ref={cancelRef} onClick={alertProps.onClose}>
                          Cancel
                        </c.Button>
                        <deleteTeamFetcher.Form method="post" action={`/api/teams/${team.id}`} replace>
                          <c.Button
                            colorScheme="red"
                            type="submit"
                            ml={3}
                            name="_action"
                            value={TeamActionMethods.DeleteTeam}
                          >
                            Delete
                          </c.Button>
                        </deleteTeamFetcher.Form>
                      </c.AlertDialogFooter>
                    </c.AlertDialogContent>
                  </c.AlertDialogOverlay>
                </c.AlertDialog>
              </c.Stack>
            )}
          </>
        )}
      </c.Box>
    </c.Flex>
  )
}
