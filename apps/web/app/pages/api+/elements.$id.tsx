import type { ActionFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { z } from "zod"

import { db } from "~/lib/db.server"
import { FORM_ACTION } from "~/lib/form"
import { formError, validateFormData } from "~/lib/form.server"
import { badRequest } from "~/lib/remix"
import { getCurrentUser } from "~/services/auth/auth.server"

export enum ElementActionMethods {
  UpdateElement = "updateElement",
  ArchiveElement = "archiveElement",
  UnarchiveElement = "unarchiveElement",
}
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const action = formData.get(FORM_ACTION) as ElementActionMethods | undefined
  const elementId = params.id as string | undefined
  if (!elementId) throw badRequest("Element ID is required")
  const element = await db.element.findFirst({ where: { id: elementId, creatorId: { equals: user.id } } })
  if (!element) throw badRequest("Element not found")
  switch (action) {
    case ElementActionMethods.UpdateElement:
      try {
        const schema = z.object({
          name: z.string().min(1).optional(),
          color: z.string().min(1).optional(),
          parentId: z.string().min(1).optional(),
        })
        const result = await validateFormData(request, schema)
        if (!result.success) return formError(result)
        const data = result.data
        const updatedElement = await db.element.update({ where: { id: elementId }, data })
        return json({ element: updatedElement, success: true })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    case ElementActionMethods.ArchiveElement:
      try {
        await db.element.update({ where: { id: elementId }, data: { archivedAt: new Date() } })
        return json({ success: true })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    case ElementActionMethods.UnarchiveElement:
      try {
        await db.element.update({ where: { id: elementId }, data: { archivedAt: null } })
        return json({ success: true })
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
