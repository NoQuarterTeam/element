import { type ActionArgs, type LoaderArgs, json, redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import dayjs from "dayjs"
import { z } from "zod"

import { TaskForm } from "~/components/TaskForm"
import { taskSelectFields } from "~/components/TaskItem"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { getUser, requireUser } from "~/services/auth/auth.server"
import { FlashType, getFlashSession } from "~/services/session/flash.server"
// import queryString from "query-string"
import type { TimelineTask } from "./api+/tasks"

export const loader = async ({ request, params }: LoaderArgs) => {
  await requireUser(request)
  const id = params.id
  if (!id) redirect("/timeline")
  const task = await db.task.findUnique({ where: { id }, select: taskSelectFields })
  if (!task) redirect("/timeline")
  return json(task)
}

export enum TaskActionMethods {
  UpdateTask = "updateTask",
  CompleteBacklogTask = "completeBacklogTask",
  DeleteTask = "deleteTask",
  AddToBacklog = "addToBacklog",
  DuplicateTask = "duplicateTask",
}

const toFormDataArray = <T extends Record<string, unknown>[]>(formData: FormData, entityName: string) =>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [...formData.entries()] // TypeScript is unhappy with this, not sure why. It should work 🤷‍♂️
    .filter(([key]) => key.startsWith(entityName))
    .reduce((acc: T, [key, value]) => {
      const [prefix, name] = key.split(".")
      const id = Number(prefix.charAt(prefix.lastIndexOf("[") + 1))
      acc[id] = {
        ...acc[id],
        [name]: value,
      }
      return acc
    }, [])

export const action = async ({ request, params }: ActionArgs) => {
  const user = await getUser(request)
  const formData = await request.formData()
  const action = formData.get("_action") as TaskActionMethods | undefined
  const taskId = params.id as string | undefined
  if (!taskId) return badRequest("Task ID is required")
  const task = await db.task.findFirst({ where: { id: taskId, creatorId: { equals: user.id } } })
  if (!task) return badRequest("Task not found")
  const { createFlash } = await getFlashSession(request)
  switch (action) {
    case TaskActionMethods.UpdateTask:
      try {
        // const todos = queryString.parse(somethingInHereFromRequest)

        const todos = (toFormDataArray(formData, "todos") as unknown as { title: string; isComplete?: string }[]).map((t) => ({
          title: t.title,
          isComplete: !!t.isComplete,
        }))

        const updateSchema = z.object({
          name: z.string().optional(),
          date: z.string().optional(),
          description: z.string().nullable().optional(),
          durationHours: z.preprocess(Number, z.number()).nullable().optional(),
          durationMinutes: z.preprocess(Number, z.number()).nullable().optional(),
          startTime: z.string().nullable().optional(),
          elementId: z.string().uuid().optional(),
        })
        const isComplete = formData.has("isComplete") && formData.get("isComplete") !== "false"
        const { data, fieldErrors } = await validateFormData(updateSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        const updatedTask = await db.task.update({
          select: taskSelectFields,
          where: { id: taskId },
          data: {
            date: data.date ? dayjs(data.date).startOf("d").add(12, "h").toDate() : undefined,
            durationHours: data.durationHours,
            durationMinutes: data.durationMinutes,
            startTime: data.startTime,
            name: data.name,
            elementId: data.elementId,
            description: data.description,
            isComplete,
            todos: {
              createMany: { data: todos },
              deleteMany: { taskId: { equals: task.id }, id: { notIn: todos.map((t) => t.id) } },
            },
          },
        })
        return json({ task: updatedTask })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error updating task") },
        })
      }
    case TaskActionMethods.CompleteBacklogTask:
      try {
        const updatedTask = await db.task.update({
          select: taskSelectFields,
          where: { id: taskId },
          data: { date: dayjs().startOf("d").add(12, "h").toDate(), isComplete: true },
        })
        return json({ task: updatedTask })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error completing task") },
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
    case TaskActionMethods.AddToBacklog:
      try {
        const backlogTask = await db.task.update({
          where: { id: taskId },
          select: taskSelectFields,
          data: { date: null, isComplete: false },
        })
        return json({ task: backlogTask })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error backlogging task") },
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

export default function TaskModal() {
  const task = useLoaderData<TimelineTask>()
  return <TaskForm task={task} />
}
