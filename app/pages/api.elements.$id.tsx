import type { ActionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { z } from "zod"

import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

export enum ElementActionMethods {
  UpdateElement = "updateElement",
  ArchiveElement = "archiveElement",
  UnarchiveElement = "unarchiveElement",
}
export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request)
  const formData = await request.formData()
  const action = formData.get("_action") as ElementActionMethods | undefined
  const elementId = params.id as string | undefined
  if (!elementId) throw badRequest("Element ID is required")
  const element = await db.element.findFirst({ where: { id: elementId, creatorId: { equals: user.id } } })
  if (!element) throw badRequest("Element not found")
  const { createFlash } = await getFlashSession(request)
  switch (action) {
    case ElementActionMethods.UpdateElement:
      try {
        const updateSchema = z.object({
          name: z.string().min(1).optional(),
          color: z.string().min(1).optional(),
        })
        const { data, fieldErrors } = await validateFormData(updateSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        const updatedElement = await db.element.update({ where: { id: elementId }, data })
        return json({ element: updatedElement })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error updating element") },
        })
      }
    case ElementActionMethods.ArchiveElement:
      try {
        await db.element.update({ where: { id: elementId }, data: { archivedAt: new Date() } })
        return json({ success: true })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error archiving element") },
        })
      }
    case ElementActionMethods.UnarchiveElement:
      try {
        await db.element.update({ where: { id: elementId }, data: { archivedAt: null } })
        return json({ success: true })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error unarchiving element") },
        })
      }
    default:
      return badRequest("Invalid action", {
        headers: { "Set-Cookie": await createFlash(FlashType.Error, "Invalid action") },
      })
  }
}
