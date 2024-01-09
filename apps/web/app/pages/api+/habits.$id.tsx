import { deleteHabitReminder } from "@element/server-services"
import type { ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import dayjs from "dayjs"
import { z } from "zod"

import { db } from "~/lib/db.server"
import { FORM_ACTION } from "~/lib/form"
import { formError, formSuccess, validateFormData } from "~/lib/form.server"
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
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const action = formData.get(FORM_ACTION) as HabitActionMethods | undefined
  const id = params.id
  if (!id) throw badRequest("ID required")

  switch (action) {
    case HabitActionMethods.Edit:
      try {
        const schema = z.object({ name: z.string().min(1) })
        const result = await validateFormData(request, schema)
        if (!result.success) return formError(result)
        const editHabit = await db.habit.update({ where: { id }, data: { name: result.data.name } })
        return formSuccess({ habit: editHabit })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    case HabitActionMethods.ToggleComplete:
      try {
        const schema = z.object({ date: z.string() })
        const result = await validateFormData(request, schema)
        if (!result.success) return formError(result)
        const data = result.data
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
        return formSuccess()
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    case HabitActionMethods.Archive:
      try {
        const habit = await db.habit.findUnique({ where: { id }, include: { reminders: true } })
        if (!habit) return badRequest("Habit not found")
        const schema = z.object({ archivedAt: z.string() })
        const result = await validateFormData(request, schema)
        if (!result.success) return formError(result)
        const archivedAt = result.data.archivedAt
        await db.habit.update({ where: { id }, data: { archivedAt: dayjs(archivedAt).toDate() } })
        await db.habitReminder.deleteMany({ where: { habitId: { equals: habit.id } } })
        await Promise.all(habit.reminders.map((r) => r.upstashScheduleId && deleteHabitReminder(r.upstashScheduleId)))
        return formSuccess()
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }
    case HabitActionMethods.Delete:
      try {
        const habit = await db.habit.findUnique({ where: { id }, include: { reminders: true } })
        if (!habit) return badRequest("Habit not found")
        await db.habit.delete({ where: { id } })
        await db.habitReminder.deleteMany({ where: { habitId: { equals: habit.id } } })
        await Promise.all(habit.reminders.map((r) => r.upstashScheduleId && deleteHabitReminder(r.upstashScheduleId)))
        return formSuccess()
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
