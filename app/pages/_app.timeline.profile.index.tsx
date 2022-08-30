import * as React from "react"
import * as c from "@chakra-ui/react"
import type { ActionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { useFetcher, useSubmit } from "@remix-run/react"
import { z } from "zod"

import { ButtonGroup } from "~/components/ButtonGroup"
import { Form, FormButton, FormError, FormField, ImageField } from "~/components/Form"
import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { UPLOAD_PATHS } from "~/lib/uploadPaths"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession, getUserSession } from "~/services/session/session.server"
import { updateUser } from "~/services/user/user.server"

import { useMe } from "./_app"

export enum ProfileActionMethods {
  DeleteAcccount = "deleteAccount",
  UpdateProfile = "updateProfile",
}

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request)
  const { createFlash } = await getFlashSession(request)
  const formData = await request.formData()
  const action = formData.get("_action") as ProfileActionMethods | undefined
  switch (action) {
    case ProfileActionMethods.UpdateProfile:
      try {
        const updateSchema = z.object({
          email: z.string().min(3).email("Invalid email").optional(),
          firstName: z.string().min(2, "Must be at least 2 characters").optional(),
          lastName: z.string().min(2, "Must be at least 2 characters").optional(),
          avatar: z.string().nullable().optional(),
        })
        const { data, fieldErrors } = await validateFormData(updateSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        // Dont need to update email address if the same as the current one
        let updateData: Partial<typeof data> = { ...data }
        if (data.email === user.email) delete updateData.email
        if (data.avatar && data.avatar === "") updateData.avatar = null
        const { error } = await updateUser(user.id, updateData)
        if (error) return badRequest({ data, formError: error })
        return redirect("/timeline/profile", {
          headers: { "Set-Cookie": await createFlash(FlashType.Success, "Profile updated") },
        })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error updating profile") },
        })
      }
    case ProfileActionMethods.DeleteAcccount:
      try {
        await db.user.update({ where: { id: user.id }, data: { archivedAt: new Date() } })
        const { destroy } = await getUserSession(request)

        const headers = new Headers([["Set-Cookie", await destroy()]])
        return redirect("/", { headers })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error deleting acccount") },
        })
      }
    default:
      return badRequest("Invalid action", {
        headers: { "Set-Cookie": await createFlash(FlashType.Error, "Invalid action") },
      })
  }
}

export default function Account() {
  const logoutSubmit = useSubmit()
  const me = useMe()
  const formRef = React.useRef<HTMLFormElement>(null)

  const alertProps = c.useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const destroyAccountFetcher = useFetcher()

  return (
    <c.Stack spacing={4}>
      <c.Text fontSize="lg" fontWeight={500}>
        Account
      </c.Text>

      <Form ref={formRef} action="?index" method="post" replace>
        <c.Stack spacing={4}>
          <FormField defaultValue={me.email} name="email" label="Email" />
          <FormField defaultValue={me.firstName} name="firstName" label="First name" />
          <FormField defaultValue={me.lastName} name="lastName" label="Last name" />
          <ImageField
            height="100px"
            defaultValue={me.avatar}
            width="100px"
            label="Avatar"
            name="avatar"
            path={UPLOAD_PATHS.userAvatar(me.id)}
          />
          <FormError />
          <ButtonGroup>
            <FormButton name="_action" value={ProfileActionMethods.UpdateProfile}>
              Save
            </FormButton>
          </ButtonGroup>
        </c.Stack>
      </Form>
      <c.Divider />
      <c.Box>
        <c.Button variant="outline" onClick={() => logoutSubmit(null, { method: "post", action: "/logout" })}>
          Log out
        </c.Button>
      </c.Box>
      <c.Divider />
      <c.Stack>
        <c.Text fontSize="sm">Danger zone</c.Text>
        <c.Text fontSize="xs">
          Permanently delete your account and all of its contents. This action is not reversible - please
          continue with caution.
        </c.Text>
        <c.Box>
          <c.Button colorScheme="red" onClick={alertProps.onOpen}>
            Delete account
          </c.Button>
        </c.Box>
      </c.Stack>

      <c.AlertDialog {...alertProps} motionPreset="slideInBottom" isCentered leastDestructiveRef={cancelRef}>
        <c.AlertDialogOverlay>
          <c.AlertDialogContent>
            <c.AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete account
            </c.AlertDialogHeader>
            <c.AlertDialogBody>Are you sure? You can't undo this action afterwards.</c.AlertDialogBody>
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
                  isLoading={destroyAccountFetcher.state !== "idle"}
                  isDisabled={destroyAccountFetcher.state !== "idle"}
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
  )
}
