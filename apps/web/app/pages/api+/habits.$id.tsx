import type { ActionFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import dayjs from "dayjs"
import { z } from "zod"

import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { getCurrentUser } from "~/services/auth/auth.server"

export enum HabitActionMethods {
  ToggleComplete = "toggleComplete",
  Archive = "archive",
  Delete = "delete",
  Edit = "edit",
}
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  if (!user.stripeSubscriptionId) return redirect("/timeline/profile/plan")
  const formData = await request.formData()
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
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    case HabitActionMethods.ToggleComplete:
      try {
        const toggleSchema = z.object({ date: z.string() })
        const { data, fieldErrors } = await validateFormData(toggleSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors })
        const now = dayjs()
        const date = dayjs(data.date)
          .set("hour", now.get("hour"))
          .set("minute", now.get("minute"))
          .set("second", now.get("second"))
          .set("millisecond", now.get("millisecond"))
          .toDate()
        const gte = dayjs(data.date).startOf("d").toDate()
        const lte = dayjs(data.date).endOf("d").toDate()

        const entries = await db.habitEntry.findMany({
          select: { id: true },
          where: { creatorId: { equals: user.id }, habitId: { equals: id }, createdAt: { gte, lte } },
        })

        if (entries.length > 0) {
          await db.habitEntry.deleteMany({ where: { id: { in: entries.map((e) => e.id) } } })
        } else {
          await db.habitEntry.create({ data: { creatorId: user.id, habitId: id, createdAt: date } })
        }
        return json({ success: true })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    case HabitActionMethods.Archive:
      try {
        const archiveSchema = z.object({ archivedAt: z.string() })
        const archiveForm = await validateFormData(archiveSchema, formData)
        if (archiveForm.fieldErrors) return badRequest(archiveForm)
        const archivedAt = archiveForm.data.archivedAt
        await db.habit.update({ where: { id }, data: { archivedAt: dayjs(archivedAt).toDate() } })
        return json({ success: true })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    case HabitActionMethods.Delete:
      try {
        await db.habit.delete({ where: { id } })
        return json({ success: true })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    default:
      return redirect("/")
  }
}
