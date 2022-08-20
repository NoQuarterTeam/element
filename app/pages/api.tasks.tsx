import type { Task } from "@prisma/client"
import type { ActionArgs, LoaderArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
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
  const backParam = url.searchParams.get("back")
  const selectedTeamId = url.searchParams.get("selectedTeamId") as string | undefined | null
  const forwardParam = url.searchParams.get("forward")
  const back = backParam ? parseInt(backParam) : DAYS_BACK
  const forward = forwardParam ? parseInt(forwardParam) : DAYS_FORWARD

  if (selectedTeamId) {
    const teamUsers = await db.team
      .findUnique({ where: { id: selectedTeamId } })
      .users({ where: { id: { equals: user.id } } })
    if (teamUsers.length === 0) throw badRequest("Not authorized")
  }
  const tasks = await db.task.findMany({
    select: taskSelectFields,
    where: {
      date: {
        gte: dayjs().subtract(back, "day").toDate(),
        lte: dayjs().add(forward, "day").toDate(),
      },
      AND: selectedTeamId
        ? [{ element: { teamId: { equals: selectedTeamId } } }]
        : { users: { some: { id: { equals: user.id } } } },
    },
  })
  return json(tasks)
}

export type TimelineTask = UseDataFunctionReturn<typeof loader>[0]

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
        const createSchema = z.object({
          name: z.string(),
          date: z.string(),
          elementId: z.string().uuid(),
          description: z.string().optional(),
          isComplete: z.string().optional(),
          durationHours: z.preprocess(Number, z.number()).optional(),
          durationMinutes: z.preprocess(Number, z.number()).optional(),
          startTime: z.string().optional(),
        })
        const isComplete = formData.get("isComplete") as string | undefined
        const newForm = await validateFormData(createSchema, formData)
        if (newForm.fieldErrors) return badRequest(newForm)
        const users = formData.getAll("users") as string[] | undefined
        const isUsersIncluded = formData.has("users")

        const newTask = await db.task.create({
          select: taskSelectFields,
          data: {
            isComplete: isComplete === "" || isComplete === "true" || false,
            durationHours: newForm.data.durationHours || null,
            durationMinutes: newForm.data.durationMinutes || null,
            startTime: newForm.data.startTime || null,
            date: newForm.data.date,
            name: newForm.data.name,
            description: newForm.data.description || null,
            element: { connect: { id: newForm.data.elementId } },
            users: { connect: isUsersIncluded && users ? users.map((id) => ({ id })) : { id: user.id } },
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
            db.task.update({ where: { id: task.id }, data: { order: task.order, date: task.date } }),
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
