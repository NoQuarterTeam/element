import type { ActionArgs } from "@remix-run/server-runtime"
import { redirect } from "@remix-run/server-runtime"
import { typedjson } from "remix-typedjson"
import { z } from "zod"

import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession, getUserSession } from "~/services/session/session.server"
import { updateUser } from "~/services/user/user.server"

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
        const { error, user: updatedUser } = await updateUser(user.id, updateData)
        if (error) return badRequest({ data, formError: error })
        return typedjson(
          { user: updatedUser },
          { headers: { "Set-Cookie": await createFlash(FlashType.Success, "Profile updated") } },
        )
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
