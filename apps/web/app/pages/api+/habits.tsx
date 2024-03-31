import type { Prisma } from "@element/database/types"
import type { ActionFunctionArgs, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import dayjs from "dayjs"
import { z } from "zod"

import { db } from "~/lib/db.server"
import { FORM_ACTION } from "~/lib/form"
import { formError, formSuccess, validateFormData } from "~/lib/form.server"
import { badRequest } from "~/lib/remix"
import { getCurrentUser } from "~/services/auth/auth.server"

const habitSelectFields = {
  id: true,
  name: true,
  startDate: true,
  archivedAt: true,
} satisfies Prisma.HabitSelect

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)
  const url = new URL(request.url)
  const backParam = url.searchParams.get("back")
  const forwardParam = url.searchParams.get("forward")

  if (!backParam) return json({ habits: [], habitEntries: [] })

  const [habits, habitEntries] = await Promise.all([
    db.habit.findMany({
      orderBy: { order: "asc" },
      select: habitSelectFields,
      where: { creatorId: { equals: user.id } },
    }),
    db.habitEntry.findMany({
      select: { id: true, habitId: true, createdAt: true },
      where: {
        creatorId: { equals: user.id },
        createdAt: {
          gte: dayjs(backParam).startOf("day").toDate(),
          lte: dayjs(forwardParam || undefined)
            .endOf("d")
            .toDate(),
        },
      },
    }),
  ])
  return json({ habits, habitEntries })
}

export type TimelineHabitResponse = SerializeFrom<typeof loader>
export type TimelineHabit = TimelineHabitResponse["habits"][0]

export type TimelineHabitEntry = TimelineHabitResponse["habitEntries"][0]

export enum HabitsActionMethods {
  CreateHabit = "createHabit",
}

const createHabitSchema = z.object({ name: z.string().min(1), date: z.string() })
export type CreateHabitFormData = typeof createHabitSchema
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const action = formData.get(FORM_ACTION) as HabitsActionMethods | undefined
  switch (action) {
    case HabitsActionMethods.CreateHabit:
      try {
        if (!user.stripeSubscriptionId) return redirect("/timeline/profile/plan")
        const result = await validateFormData(request, createHabitSchema)
        if (!result.success) return formError(result)
        const date = result.data.date
        const habit = await db.habit.create({
          select: habitSelectFields,
          data: { creatorId: user.id, name: result.data.name, startDate: dayjs(date).toDate() },
        })

        return formSuccess({ habit })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        }
        return badRequest("Something went wrong")
      }

    default:
      return redirect("/")
  }
}
