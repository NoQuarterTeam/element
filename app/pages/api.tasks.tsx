import type { Task } from "@prisma/client"
import type { ActionArgs, LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import dayjs from "dayjs"
import { z } from "zod"

import { taskSelectFields } from "~/components/TaskItem"
import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { DAYS_BACK, DAYS_FORWARD } from "~/lib/hooks/useTimelineDays"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const url = new URL(request.url)
  const initialDateParam = url.searchParams.get("d")

  const initialDate =
    initialDateParam && dayjs(initialDateParam).isValid() ? dayjs(initialDateParam) : dayjs()

  const backParam = url.searchParams.get("back")
  const forwardParam = url.searchParams.get("forward")

  const back = backParam ? parseInt(backParam) : DAYS_BACK
  const forward = forwardParam ? parseInt(forwardParam) : DAYS_FORWARD

  const tasks = await db.task.findMany({
    select: taskSelectFields,
    where: {
      creatorId: { equals: user.id },
      element: { archivedAt: { equals: null } },
      date: {
        gte: initialDate.subtract(back, "day").startOf("d").toDate(),
        lte: initialDate.add(forward, "day").endOf("d").toDate(),
      },
    },
  })
  return json(tasks)
}

export type TimelineTaskLoader = SerializeFrom<typeof loader>
export type TimelineTask = SerializeFrom<typeof loader>[0]

export enum TasksActionMethods {
  AddTask = "addTask",
  UpdateOrder = "updateOrder",
}
export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request)
  const formData = await request.formData()
  const { createFlash } = await getFlashSession(request)
  const action = formData.get("_action") as TasksActionMethods | undefined

  switch (action) {
    case TasksActionMethods.AddTask:
      try {
        if (!user.stripeSubscriptionId) {
          const taskCount = await db.task.count({ where: { creatorId: { equals: user.id } } })
          if (taskCount >= 1000) return redirect("/timeline/profile/plan/limit-task")
        }
        const createSchema = z.object({
          name: z.string(),
          date: z.string(),
          elementId: z.string().uuid(),
          description: z.string().nullable(),
          durationHours: z.preprocess(Number, z.number()).nullable(),
          durationMinutes: z.preprocess(Number, z.number()).nullable(),
          startTime: z.string().nullable(),
        })
        const isComplete = formData.has("isComplete")
        const newForm = await validateFormData(createSchema, formData)
        if (newForm.fieldErrors) return badRequest(newForm)
        const newTask = await db.task.create({
          select: taskSelectFields,
          data: {
            isComplete,
            durationHours: newForm.data.durationHours || null,
            durationMinutes: newForm.data.durationMinutes || null,
            startTime: newForm.data.startTime || null,
            date: dayjs(newForm.data.date).add(12, "h").toDate(),
            name: newForm.data.name,
            description: newForm.data.description || null,
            element: { connect: { id: newForm.data.elementId } },
            creator: { connect: { id: user.id } },
          },
        })
        return json({ task: newTask })
      } catch (e: any) {
        return json(e.message, {
          status: 400,
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error creating task") },
        })
      }
    case TasksActionMethods.UpdateOrder:
      try {
        const jsonTasks = formData.get("tasks") as string | undefined
        if (!jsonTasks) throw new Error()
        const tasks = JSON.parse(jsonTasks) as Task[]
        await Promise.all(
          tasks.map((task) =>
            db.task.update({
              where: { id: task.id },
              data: { order: task.order, date: dayjs(task.date).startOf("d").add(12, "h").toDate() },
            }),
          ),
        )
        return json({ success: true })
      } catch (e: any) {
        return json(e.message, {
          status: 400,
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error updating order") },
        })
      }
    default:
      return redirect("/")
  }
}
