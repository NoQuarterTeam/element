import { sendAccountVerificationEmail } from "@element/server-services"
import type { ActionFunctionArgs } from "@remix-run/node"
import { useFetcher, useSubmit } from "@remix-run/react"
import { z } from "zod"

import { AlertDialog } from "~/components/ui/AlertDialog"
import { Button } from "~/components/ui/Button"
import { ButtonGroup } from "~/components/ui/ButtonGroup"
import { Form, FormButton, FormError, FormField, ImageField } from "~/components/ui/Form"
import { db } from "~/lib/db.server"
import { FORM_ACTION } from "~/lib/form"
import { formError, validateFormData } from "~/lib/form.server"
import { useMe } from "~/lib/hooks/useUser"
import { createToken } from "~/lib/jwt.server"
import { badRequest, redirect } from "~/lib/remix"
import { getCurrentUser } from "~/services/auth/auth.server"
import { getUserSession } from "~/services/session/session.server"

export enum ProfileActionMethods {
  DeleteAcccount = "deleteAccount",
  UpdateProfile = "updateProfile",
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const action = formData.get(FORM_ACTION) as ProfileActionMethods | undefined
  switch (action) {
    case ProfileActionMethods.UpdateProfile:
      try {
        const schema = z.object({
          email: z.string().min(3).email("Invalid email").optional(),
          firstName: z.string().min(2, "Must be at least 2 characters").optional(),
          lastName: z.string().min(2, "Must be at least 2 characters").optional(),
          avatar: z.string().nullable().optional(),
        })

        const result = await validateFormData(request, schema)
        if (!result.success) return formError(result)
        const data = result.data
        // Dont need to update email address if the same as the current one
        const updateData: Partial<typeof data> = { ...data }
        if (data.email === user.email) delete updateData.email
        if (data.avatar === "") updateData.avatar = null
        if (updateData.email) {
          const existing = await db.user.findFirst({ where: { email: { equals: updateData.email } } })
          if (existing) return badRequest({ data, formError: "User with these details already exists" })
          const token = await createToken({ id: user.id })
          await sendAccountVerificationEmail(user, token)
        }
        await db.user.update({ where: { id: user.id }, data: { ...data, verifiedAt: updateData.email ? null : undefined } })
        return redirect("/timeline/profile", request, {
          flash: {
            title: "Profile updated",
            description: updateData.email ? "Verification email sent to " + updateData.email : undefined,
          },
        })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    case ProfileActionMethods.DeleteAcccount:
      try {
        await db.user.update({ where: { id: user.id }, data: { archivedAt: new Date() } })
        const { destroy } = await getUserSession(request)

        const headers = new Headers([["Set-Cookie", await destroy()]])
        return redirect("/", request, { headers, flash: { title: "Account deleted!" } })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    default:
      return badRequest("Invalid action")
  }
}

export default function Account() {
  const logoutSubmit = useSubmit()
  const me = useMe()
  const verifyFetcher = useFetcher()

  return (
    <div className="space-y-2">
      <p className="text-lg font-medium">Account</p>
      {!me.verifiedAt && (
        <verifyFetcher.Form action="/api/verify" method="post">
          <div className="space-y-2 rounded-sm bg-orange-100 p-2 dark:bg-orange-900">
            <p className="text-md">Your account is not yet verified</p>
            <p className="text-xs">Please check your email inbox for a verification link</p>
            <Button type="submit" variant="outline" className="font-normal" isLoading={verifyFetcher.state !== "idle"}>
              Resend email verification
            </Button>
          </div>
        </verifyFetcher.Form>
      )}
      <Form method="post" replace>
        <div className="space-y-2">
          <FormField defaultValue={me.email} name="email" label="Email" />
          <FormField defaultValue={me.firstName} name="firstName" label="First name" />
          <FormField defaultValue={me.lastName} name="lastName" label="Last name" />
          <ImageField defaultValue={me.avatar} className="sq-24 text-center" label="Avatar" name="avatar" />
          <FormError />
          <ButtonGroup>
            <FormButton name="_action" value={ProfileActionMethods.UpdateProfile}>
              Save
            </FormButton>
          </ButtonGroup>
        </div>
      </Form>
      <hr />
      <div>
        <Button variant="outline" onClick={() => logoutSubmit(null, { method: "post", action: "/logout" })}>
          Log out
        </Button>
      </div>
      <hr />
      <div className="space-y-2">
        <p className="text-sm">Danger zone</p>
        <p className="text-xs">
          Permanently delete your account and all of its contents. This action is not reversible - please continue with caution.
        </p>
        <AlertDialog
          trigger={<Button variant="destructive">Delete account</Button>}
          confirmButton={
            <Form method="post" replace>
              <Button name="_action" value={ProfileActionMethods.DeleteAcccount} variant="destructive" type="submit">
                Delete account
              </Button>
            </Form>
          }
        />
      </div>
    </div>
  )
}
