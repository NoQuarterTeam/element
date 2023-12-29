import { Dialog } from "@headlessui/react"
import { type ActionFunctionArgs, json, type LoaderFunctionArgs, redirect, type SerializeFrom } from "@remix-run/node"
import { useLoaderData, useNavigate } from "@remix-run/react"
import dayjs from "dayjs"
import { z } from "zod"

import { TaskForm } from "~/components/TaskForm"
import { taskItemSelectFields } from "~/components/TaskItem"
import { db } from "~/lib/db.server"
import { FORM_ACTION } from "~/lib/form"
import { formError, formSuccess, getFormDataArray, validateFormData } from "~/lib/form.server"
import { badRequest } from "~/lib/remix"
import { getCurrentUser, requireUser } from "~/services/auth/auth.server"

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUser(request)
  const id = params.id
  if (!id) redirect("/timeline")
  const task = await db.task.findUnique({
    where: { id },
    select: {
      ...taskItemSelectFields,
      todos: { orderBy: { createdAt: "asc" }, select: { id: true, isComplete: true, name: true } },
    },
  })
  if (!task) redirect("/timeline")
  return json(task)
}

export type TaskDetail = SerializeFrom<typeof loader>

export enum TaskActionMethods {
  UpdateTask = "updateTask",
  CompleteBacklogTask = "completeBacklogTask",
  DeleteTask = "deleteTask",
  AddToBacklog = "addToBacklog",
  DuplicateTask = "duplicateTask",
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const action = formData.get(FORM_ACTION) as TaskActionMethods | undefined
  const taskId = params.id as string | undefined
  if (!taskId) return badRequest("Task ID is required")
  const task = await db.task.findFirst({ where: { id: taskId, creatorId: { equals: user.id } } })

  if (!task) return badRequest("Task not found")
  switch (action) {
    case TaskActionMethods.UpdateTask:
      try {
        const schema = z.object({
          name: z.string().optional(),
          date: z
            .preprocess((d) => (d ? dayjs(d as any).toDate() : undefined), z.date(), {
              errorMap: () => ({ message: "Invalid date" }),
            })
            .nullable()
            .optional(),
          description: z.string().nullable().optional(),
          durationHours: z.preprocess(Number, z.number()).nullable().optional(),
          durationMinutes: z.preprocess(Number, z.number()).nullable().optional(),
          startTime: z.string().nullable().optional(),
          elementId: z.string().uuid().optional(),
        })
        const hasTodos = formData.has("hasTodos")
        const result = await validateFormData(request, schema)
        if (!result.success) return formError(result)

        const todos =
          hasTodos &&
          getFormDataArray(formData, "todos").map((t) => ({
            name: t.name as string,
            isComplete: !!t.isComplete,
          }))
        const data = result.data
        const updatedTask = await db.task.update({
          select: taskItemSelectFields,
          where: { id: taskId },
          data: {
            date: data.date ? dayjs(data.date).startOf("d").add(12, "h").toDate() : undefined,
            durationHours: data.durationHours,
            durationMinutes: data.durationMinutes,
            startTime: data.startTime,
            name: data.name,
            elementId: data.elementId,
            description: data.description,
            isComplete: formData.has("isComplete") ? formData.get("isComplete") !== "false" : undefined,
            isImportant: formData.has("isImportant") ? formData.get("isImportant") === "true" : undefined,
            todos: todos ? { deleteMany: {}, createMany: { data: todos } } : undefined,
          },
        })
        return formSuccess({ task: updatedTask })
      } catch (e: any) {
        return badRequest(e.message)
      }
    case TaskActionMethods.CompleteBacklogTask:
      try {
        const updatedTask = await db.task.update({
          select: taskItemSelectFields,
          where: { id: taskId },
          data: { date: dayjs().startOf("d").add(12, "h").toDate(), isComplete: true },
        })
        return formSuccess({ task: updatedTask })
      } catch (e: any) {
        return badRequest(e.message)
      }
    case TaskActionMethods.DuplicateTask:
      try {
        const taskToDupe = await db.task.findUniqueOrThrow({
          where: { id: taskId },
          include: { todos: true },
        })
        const newTask = await db.task.create({
          select: taskItemSelectFields,
          data: {
            ...taskToDupe,
            repeat: null,
            createdAt: undefined,
            updatedAt: undefined,
            todos: { createMany: { data: taskToDupe.todos.map((t) => ({ name: t.name, isComplete: t.isComplete })) } },
            id: undefined,
          },
        })
        return formSuccess({ task: newTask })
      } catch (e: any) {
        return badRequest(e.message)
      }
    case TaskActionMethods.AddToBacklog:
      try {
        const backlogTask = await db.task.update({
          where: { id: taskId },
          select: taskItemSelectFields,
          data: { date: null, isComplete: false },
        })
        return formSuccess({ task: backlogTask })
      } catch (e: any) {
        return badRequest(e.message)
      }
    case TaskActionMethods.DeleteTask:
      try {
        const shouldDeleteFuture = formData.get("shouldDeleteFuture") === "true"
        const task = await db.task.findUniqueOrThrow({ where: { id: taskId } })
        await db.$transaction(async (transaction) => {
          if (shouldDeleteFuture && task.date) {
            await transaction.task.deleteMany({
              where: { repeatParentId: { equals: task.repeat ? task.id : task.repeatParentId }, date: { gt: task.date } },
            })
          }
          await transaction.task.delete({ where: { id: taskId } })
        })

        return formSuccess()
      } catch (e: any) {
        return badRequest(e.message)
      }
    default:
      return badRequest("Invalid action")
  }
}

export default function TaskModal() {
  const task = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  return (
    <Dialog open={true} as="div" className="relative z-50" onClose={() => navigate("/timeline")}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full flex-col items-center justify-start p-0 sm:p-4">
          <Dialog.Panel className="mt-10 w-full max-w-xl overflow-hidden bg-white text-left shadow-xl transition-all dark:bg-gray-700">
            <TaskForm task={task} onClose={() => navigate("/timeline")} />
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
