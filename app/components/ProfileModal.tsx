import * as React from "react"
import { FiSettings } from "react-icons/fi"
import * as c from "@chakra-ui/react"
import { useFetcher, useSubmit } from "@remix-run/react"

import { shallowEqual } from "~/lib/form"
import { transformImage } from "~/lib/helpers/image"
import { UPLOAD_PATHS } from "~/lib/uploadPaths"
import { useMe } from "~/pages/_timeline"
import { ProfileActionMethods } from "~/pages/api.profile"

import { FormError, FormField, ImageField } from "./Form"

export function ProfileModal() {
  const me = useMe()

  const [tab, setTab] = React.useState<"account" | "settings">("account")

  const logoutSubmit = useSubmit()

  const formRef = React.useRef<HTMLFormElement>(null)
  const [isDirty, setIsDirty] = React.useState(false)
  const updateProfileFetcher = useFetcher()

  const bg = c.useColorModeValue("gray.50", "gray.800")
  const color = c.useColorModeValue("gray.400", "gray.500")

  const alertProps = c.useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const destroyAccountFetcher = useFetcher()

  if (!me) return null
  return (
    <c.Flex minH={650} h="100%" overflow="hidden" borderRadius="md">
      <c.Box minW={140} w="min-content" h="auto" bg={bg}>
        <c.Text fontSize="0.7rem" px={4} w="min-content" color={color} py={2}>
          {me.email}
        </c.Text>
        <c.Stack spacing={0}>
          <c.Button
            justifyContent="flex-start"
            pl={4}
            variant={tab === "account" ? "solid" : "ghost"}
            fontWeight={400}
            fontSize="0.8rem"
            leftIcon={
              <c.Avatar
                src={me.avatar ? transformImage(me.avatar, "w_30,h_30,g_faces") : undefined}
                name={me.firstName + " " + me.lastName}
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
            variant={tab === "settings" ? "solid" : "ghost"}
            fontWeight={400}
            fontSize="0.8rem"
            leftIcon={<c.Box as={FiSettings} boxSize="15px" />}
            borderRadius={0}
            onClick={() => setTab("settings")}
          >
            Settings
          </c.Button>
        </c.Stack>
      </c.Box>
      <c.Box p={4} w="100%">
        {tab === "account" ? (
          <c.Stack spacing={4} pb={6}>
            <c.Text fontSize="lg" fontWeight={500}>
              Account
            </c.Text>
            <updateProfileFetcher.Form
              ref={formRef}
              action="/api/profile"
              method="post"
              replace
              onChange={(e) => {
                const formData = new FormData(e.currentTarget)
                const data = Object.fromEntries(formData) as Record<string, string>
                const { firstName, lastName, email, avatar } = me
                const isDirty = !shallowEqual({ avatar, firstName, lastName, email }, data)
                setIsDirty(isDirty)
              }}
            >
              <c.Stack spacing={4}>
                <FormField
                  defaultValue={me.email}
                  name="email"
                  label="Email"
                  error={updateProfileFetcher.data?.fieldErrors?.email?.[0]}
                />
                <FormField
                  defaultValue={me.firstName}
                  name="firstName"
                  label="First name"
                  error={updateProfileFetcher.data?.fieldErrors?.firstName?.[0]}
                />
                <FormField
                  defaultValue={me.lastName}
                  name="lastName"
                  label="Last name"
                  error={updateProfileFetcher.data?.fieldErrors?.lastName?.[0]}
                />
                <ImageField
                  height="100px"
                  defaultValue={me.avatar}
                  width="100px"
                  error={updateProfileFetcher.data?.fieldErrors?.avatar?.[0]}
                  label="Avatar"
                  name="avatar"
                  path={UPLOAD_PATHS.userAvatar(me.id)}
                />
                <FormError error={updateProfileFetcher.data?.formError} />
                <c.ButtonGroup>
                  <c.Button
                    type="submit"
                    colorScheme="orange"
                    isDisabled={!isDirty || updateProfileFetcher.state === "submitting"}
                    isLoading={updateProfileFetcher.state === "submitting"}
                    name="_action"
                    value={ProfileActionMethods.UpdateProfile}
                  >
                    Save
                  </c.Button>
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
                </c.ButtonGroup>
              </c.Stack>
            </updateProfileFetcher.Form>
            <c.Divider />
            <c.Box>
              <c.Button
                variant="outline"
                onClick={() => logoutSubmit(null, { method: "post", action: "/logout" })}
              >
                Log out
              </c.Button>
            </c.Box>
          </c.Stack>
        ) : tab === "settings" ? (
          <>
            <c.Stack spacing={4} pb={6}>
              <c.Text fontSize="lg" fontWeight={500}>
                Settings
              </c.Text>

              <c.Stack>
                <c.Text fontSize="sm">Danger zone</c.Text>
                <c.Text fontSize="xs">
                  Permanently delete your account and all of its contents. This action is not reversible -
                  please continue with caution.
                </c.Text>
                <c.Box>
                  <c.Button colorScheme="red" onClick={alertProps.onOpen}>
                    Delete account
                  </c.Button>
                </c.Box>

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
                        <destroyAccountFetcher.Form method="post" action="/api/profile" replace>
                          <c.Button
                            colorScheme="red"
                            type="submit"
                            ml={3}
                            name="_action"
                            value={ProfileActionMethods.DeleteAcccount}
                          >
                            Delete
                          </c.Button>
                        </destroyAccountFetcher.Form>
                      </c.AlertDialogFooter>
                    </c.AlertDialogContent>
                  </c.AlertDialogOverlay>
                </c.AlertDialog>
              </c.Stack>
            </c.Stack>
          </>
        ) : null}
      </c.Box>
    </c.Flex>
  )
}
