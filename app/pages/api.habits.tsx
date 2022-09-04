import type { ActionArgs, LoaderArgs, SerializeFrom } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { json } from "@remix-run/node"
import dayjs from "dayjs"
import { badRequest } from "remix-utils"
import { z } from "zod"

import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { DAYS_BACK } from "~/lib/hooks/useTimelineDays"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const url = new URL(request.url)
  const backParam = url.searchParams.get("back")
  const back = backParam ? parseInt(backParam) : DAYS_BACK
  const [habits, habitEntries] = await Promise.all([
    db.habit.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, startDate: true, archivedAt: true },
      where: {
        creatorId: { equals: user.id },
        startDate: {
          gte: dayjs().subtract(back, "day").startOf("d").toDate(),
        },
      },
    }),
    db.habitEntry.findMany({
      select: { id: true, habitId: true, createdAt: true },
      where: {
        creatorId: { equals: user.id },
        createdAt: {
          gte: dayjs().subtract(back, "day").startOf("d").toDate(),
          lte: dayjs().endOf("d").toDate(),
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
export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request)
  const formData = await request.formData()
  const { createFlash } = await getFlashSession(request)
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
        return json(e.message, {
          status: 400,
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error creating habit entry") },
        })
      }

    default:
      return redirect("/")
  }
}
