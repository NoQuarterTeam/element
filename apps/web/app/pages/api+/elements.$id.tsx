import { updateElementSchema } from "@element/server-schemas"
import type { ActionFunctionArgs } from "@remix-run/node"

import { db } from "~/lib/db.server"
import { FORM_ACTION } from "~/lib/form"
import { formError, formSuccess, validateFormData } from "~/lib/form.server"
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
  await db.element.findFirstOrThrow({ where: { id: elementId, creatorId: { equals: user.id } } })

  switch (action) {
    case ElementActionMethods.UpdateElement:
      try {
        const result = await validateFormData(request, updateElementSchema)
        if (!result.success) return formError(result)
        const data = result.data
        const updatedElement = await db.element.update({ where: { id: elementId }, data })
        return formSuccess({ element: updatedElement })
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
        return formSuccess()
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
        return formSuccess()
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
