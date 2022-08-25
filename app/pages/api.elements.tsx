import { SubscriptionStatus } from "@prisma/client"
import type { ActionArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import { z } from "zod"

import { randomHexColor } from "~/lib/color"
import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

export enum ElementsActionMethods {
  CreateElement = "createElement",
}
export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request)
  const formData = await request.formData()
  const action = formData.get("_action") as ElementsActionMethods | undefined

  const { createFlash } = await getFlashSession(request)
  switch (action) {
    case ElementsActionMethods.CreateElement:
      try {
        if (!user.stripeSubscriptionId || user.subscriptionStatus === SubscriptionStatus.CANCELLED) {
          const elementCount = await db.element.count({
            where: { archivedAt: { equals: null }, creatorId: { equals: user.id } },
          })
          if (elementCount >= 5)
            return badRequest({ formError: "Element limit reached, upgrade to the Pro plan to add more" })
        }
        const createSchema = z.object({
          name: z.string().min(1),
          color: z.string().min(1),
          parentId: z.string().nullable().optional(),
        })

        const { data, fieldErrors } = await validateFormData(createSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        let color = data.color
        if (!color && data.parentId) {
          const parent = await db.element.findUniqueOrThrow({ where: { id: data.parentId } })
          color = parent.color
        }
        if (!color) color = randomHexColor()
        const updatedElement = await db.element.create({ data: { ...data, color, creatorId: user.id } })
        return json({ element: updatedElement })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error updating element") },
        })
      }
    default:
      return badRequest("Invalid action", {
        headers: { "Set-Cookie": await createFlash(FlashType.Error, "Invalid action") },
      })
  }
}
