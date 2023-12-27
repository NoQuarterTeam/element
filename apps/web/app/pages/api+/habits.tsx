import type { ActionFunctionArgs, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import dayjs from "dayjs"
import { z } from "zod"

import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { getCurrentUser } from "~/services/auth/auth.server"
import { FlashType, getFlashSession } from "~/services/session/flash.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)
  const url = new URL(request.url)
  const backParam = url.searchParams.get("back")
  const forwardParam = url.searchParams.get("forward")

  if (!backParam) return json({ habits: [], habitEntries: [] })

  const [habits, habitEntries] = await Promise.all([
    db.habit.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, startDate: true, archivedAt: true },
      where: {
        creatorId: { equals: user.id },
      },
    }),
    db.habitEntry.findMany({
      select: { id: true, habitId: true, createdAt: true },
      where: {
        creatorId: { equals: user.id },
        createdAt: {
          gte: dayjs(backParam).startOf("d").toDate(),
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
export type TimelineHabit = SerializeFrom<typeof loader>["habits"][0]
export type TimelineHabitEntry = SerializeFrom<typeof loader>["habitEntries"][0]

export enum HabitsActionMethods {
  CreateHabit = "createHabit",
}
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  const formData = await request.formData()
  const action = formData.get("_action") as HabitsActionMethods | undefined
  switch (action) {
    case HabitsActionMethods.CreateHabit:
      try {
        if (!user.stripeSubscriptionId) {
          return redirect("/timeline/profile/plan")
        }
        const createSchema = z.object({ name: z.string(), date: z.string() })
        const createForm = await validateFormData(createSchema, formData)
        if (createForm.fieldErrors) return badRequest(createForm)
        const date = createForm.data.date
        const habit = await db.habit.create({
          data: { creatorId: user.id, name: createForm.data.name, startDate: dayjs(date).toDate() },
        })
        return json({ habit })
      } catch (e: any) {
        return json(e.message)
      }

    default:
      return redirect("/")
  }
}
