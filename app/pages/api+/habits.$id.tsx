import type { ActionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
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
  Archive = "archive",
  Delete = "delete",
  Edit = "edit",
}
export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request)
  if (!user.stripeSubscriptionId) {
    return redirect("/timeline/profile/plan")
  }
  const formData = await request.formData()
  const { createFlash } = await getFlashSession(request)
  const action = formData.get("_action") as HabitActionMethods | undefined
  const id = params.id
  if (!id) throw badRequest("ID required")
  const habit = await db.habit.findUnique({ where: { id } })
  if (!habit) return badRequest("Habit not found")

  switch (action) {
    case HabitActionMethods.Edit:
      try {
        const editSchema = z.object({ name: z.string() })
        const editForm = await validateFormData(editSchema, formData)
        if (editForm.fieldErrors) return badRequest(editForm)
        const editHabit = await db.habit.update({ where: { id }, data: { name: editForm.data.name } })
        return json({ habit: editHabit })
      } catch (e: any) {
        return json(e.message, {
          status: 400,
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error creating habit entry") },
        })
      }
    case HabitActionMethods.ToggleComplete:
      try {
        const toggleSchema = z.object({ date: z.string() })
        const toggleForm = await validateFormData(toggleSchema, formData)
        if (toggleForm.fieldErrors) return badRequest(toggleForm)
        const now = dayjs()
        const date = dayjs(toggleForm.data.date)
          .set("hour", now.get("hour"))
          .set("minute", now.get("minute"))
          .set("second", now.get("second"))
          .set("millisecond", now.get("millisecond"))
          .toDate()
        const gt = dayjs(date).startOf("d").toDate()
        const lte = dayjs(date).endOf("d").toDate()

        const entries = await db.habitEntry.findMany({
          select: { id: true },
          where: {
            creatorId: { equals: user.id },
            habitId: { equals: id },
            createdAt: { gt, lte },
          },
        })

        if (entries.length > 0) {
          await db.habitEntry.deleteMany({ where: { id: { in: entries.map((e) => e.id) } } })
        } else {
          await db.habitEntry.create({
            data: { creatorId: user.id, habitId: id, createdAt: date },
          })
        }
        return json({ success: true })
      } catch (e: any) {
        return json(e.message, {
          status: 400,
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error creating habit entry") },
        })
      }
    case HabitActionMethods.Archive:
      try {
        const archiveSchema = z.object({ archivedAt: z.string() })
        const archiveForm = await validateFormData(archiveSchema, formData)
        if (archiveForm.fieldErrors) return badRequest(archiveForm)
        const archivedAt = archiveForm.data.archivedAt
        await db.habit.update({ where: { id }, data: { archivedAt: dayjs(archivedAt).toDate() } })
        return json({ success: true })
      } catch (e: any) {
        return json(e.message, {
          status: 400,
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error archiving habit") },
        })
      }
    case HabitActionMethods.Delete:
      try {
        await db.habit.delete({ where: { id } })
        return json({ success: true })
      } catch (e: any) {
        return json(e.message, {
          status: 400,
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error archiving habit") },
        })
      }
    default:
      return redirect("/")
  }
}
