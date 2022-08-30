import type { ActionArgs} from "@remix-run/node";
import { json,redirect } from "@remix-run/node"
import dayjs from "dayjs"
import { z } from "zod"

import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

export enum HabitActionMethods {
  ToggleComplete = "toggleComplete",
}
export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request)
  const formData = await request.formData()
  const { createFlash } = await getFlashSession(request)
  const action = formData.get("_action") as HabitActionMethods | undefined
  const id = params.id
  if (!id) throw badRequest("ID required")

  switch (action) {
    case HabitActionMethods.ToggleComplete:
      try {
        if (!user.stripeSubscriptionId) {
          return redirect("/timeline/profile/plan")
        }
        const toggleSchema = z.object({ date: z.string() })

        const toggleForm = await validateFormData(toggleSchema, formData)
        if (toggleForm.fieldErrors) return badRequest(toggleForm)
        const date = toggleForm.data.date
        const gt = dayjs(date).startOf("d").toDate()
        const lte = dayjs(date).endOf("d").toDate()
        const entry = await db.habitEntry.findFirst({
          select: { id: true },
          where: {
            creatorId: { equals: user.id },
            habitId: { equals: id },
            createdAt: { gt, lte },
          },
        })
        if (entry) {
          await db.habitEntry.delete({ where: { id: entry.id } })
        } else {
          await db.habitEntry.create({
            data: { creatorId: user.id, habitId: id, createdAt: dayjs(date).toDate() },
          })
        }
        return json({ success: true })
      } catch (e: any) {
        return json(e.message, {
          status: 400,
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error creating habit entry") },
        })
      }

    default:
      return redirect("/")
  }
}
