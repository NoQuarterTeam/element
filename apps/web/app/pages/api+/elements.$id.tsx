import type { ActionFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { z } from "zod"

import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { getCurrentUser } from "~/services/auth/auth.server"

export enum ElementActionMethods {
  UpdateElement = "updateElement",
  ArchiveElement = "archiveElement",
  UnarchiveElement = "unarchiveElement",
}
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  const formData = await request.formData()
  const action = formData.get("_action") as ElementActionMethods | undefined
  const elementId = params.id as string | undefined
  if (!elementId) throw badRequest("Element ID is required")
  const element = await db.element.findFirst({ where: { id: elementId, creatorId: { equals: user.id } } })
  if (!element) throw badRequest("Element not found")
  switch (action) {
    case ElementActionMethods.UpdateElement:
      try {
        const updateSchema = z.object({
          name: z.string().min(1).optional(),
          color: z.string().min(1).optional(),
          parentId: z.string().min(1).optional(),
        })
        const { data, fieldErrors } = await validateFormData(updateSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        const updatedElement = await db.element.update({ where: { id: elementId }, data })
        return json({ element: updatedElement })
      } catch (e: any) {
        return badRequest(e.message)
      }
    case ElementActionMethods.ArchiveElement:
      try {
        await db.element.update({ where: { id: elementId }, data: { archivedAt: new Date() } })
        return json({ success: true })
      } catch (e: any) {
        return badRequest(e.message)
      }
    case ElementActionMethods.UnarchiveElement:
      try {
        await db.element.update({ where: { id: elementId }, data: { archivedAt: null } })
        return json({ success: true })
      } catch (e: any) {
        return badRequest(e.message)
      }
    default:
      return badRequest("Invalid action")
  }
}
