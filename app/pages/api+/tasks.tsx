import type { Task } from "@prisma/client"
import type { ActionArgs, LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import dayjs from "dayjs"
import { z } from "zod"

import { taskSelectFields } from "~/components/TaskItem"
import { db } from "~/lib/db.server"
import { getFormDataArray, validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { getUser } from "~/services/auth/auth.server"
import { FlashType, getFlashSession } from "~/services/session/flash.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  const url = new URL(request.url)
  const backParam = url.searchParams.get("back")
  const forwardParam = url.searchParams.get("forward")
  const elementIds = url.searchParams.getAll("elementId")

  if (!backParam || !forwardParam) return json([])
  const tasks = await db.task.findMany({
    select: taskSelectFields,
    orderBy: { order: "asc" },
    where: {
      creatorId: { equals: user.id },
      element: {
        archivedAt: elementIds.length ? undefined : { equals: null },
        id: elementIds.length ? { in: elementIds } : undefined,
      },
      date: {
        not: { equals: null },
        gte: dayjs(backParam).startOf("d").toDate(),
        lte: dayjs(forwardParam).startOf("d").toDate(),
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
  const user = await getUser(request)
  const formData = await request.formData()
  const { createFlash } = await getFlashSession(request)
  const action = formData.get("_action") as TasksActionMethods | undefined

  const todos = getFormDataArray(formData, "todos").map((t) => ({
    name: t.name as string,
    isComplete: !!t.isComplete,
  }))

  switch (action) {
    case TasksActionMethods.AddTask:
      try {
        if (!user.stripeSubscriptionId) {
          const taskCount = await db.task.count({ where: { creatorId: { equals: user.id } } })
          if (taskCount >= 1000) return redirect("/timeline/profile/plan/limit-task")
        }
        const createSchema = z.object({
          name: z.string(),
          elementId: z.string().uuid(),
          date: z.string().optional().nullable(),
          description: z.string().optional().nullable(),
          durationHours: z
            .preprocess((d) => (d ? Number(d) : undefined), z.number())
            .optional()
            .nullable(),
          durationMinutes: z
            .preprocess((d) => (d ? Number(d) : undefined), z.number())
            .optional()
            .nullable(),
          startTime: z.string().optional().nullable(),
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
            date: newForm.data.date ? dayjs(newForm.data.date).add(12, "h").toDate() : null,
            name: newForm.data.name,
            description: newForm.data.description || null,
            element: { connect: { id: newForm.data.elementId } },
            creator: { connect: { id: user.id } },
            todos: { createMany: { data: todos } },
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
              data: {
                order: task.order,
                date: dayjs(task.date).startOf("d").add(12, "h").toDate(),
              },
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
