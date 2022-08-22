import type { ActionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { z } from "zod"

import { taskSelectFields } from "~/components/TaskItem"
import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

export enum TaskActionMethods {
  UpdateTask = "updateTask",
  DeleteTask = "deleteTask",
  DuplicateTask = "duplicateTask",
}
export const action = async ({ request, params }: ActionArgs) => {
  await requireUser(request)
  const formData = await request.formData()
  const action = formData.get("_action") as TaskActionMethods | undefined
  const taskId = params.id as string | undefined
  if (!taskId) return badRequest("Task ID is required")

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task) return badRequest("Task not found")
  const { createFlash } = await getFlashSession(request)
  switch (action) {
    case TaskActionMethods.UpdateTask:
      try {
        const updateSchema = z.object({
          name: z.string().optional(),
          date: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          isComplete: z.string().optional(),
          durationHours: z.preprocess(Number, z.number()).optional(),
          durationMinutes: z.preprocess(Number, z.number()).optional(),
          startTime: z.string().optional(),
          elementId: z.string().uuid().optional(),
        })
        const hasComplete = formData.has("isComplete")
        const isComplete = formData.get("isComplete") as string | undefined
        const { data, fieldErrors } = await validateFormData(updateSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })

        const updatedTask = await db.task.update({
          select: taskSelectFields,
          where: { id: taskId },
          data: {
            date: data.date || undefined,
            durationHours: data.durationHours || undefined,
            durationMinutes: data.durationMinutes || undefined,
            startTime: data.startTime || undefined,
            name: data.name,
            elementId: data.elementId || undefined,
            description: data.description || undefined,
            isComplete: hasComplete ? isComplete === "" || isComplete === "true" || false : undefined,
          },
        })
        return json({ task: updatedTask })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error updating task") },
        })
      }
    case TaskActionMethods.DuplicateTask:
      try {
        const taskToDupe = await db.task.findUniqueOrThrow({ where: { id: taskId } })
        const newTask = await db.task.create({
          select: taskSelectFields,
          data: {
            ...taskToDupe,
            id: undefined,
          },
        })
        return json({ task: newTask })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error deleting task") },
        })
      }
    case TaskActionMethods.DeleteTask:
      try {
        await db.task.delete({ where: { id: taskId } })
        return json({ success: true })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error deleting task") },
        })
      }
    default:
      return badRequest("Invalid action", {
        headers: { "Set-Cookie": await createFlash(FlashType.Error, "Invalid action") },
      })
  }
}
