import { type Task, TaskRepeat } from "@element/database/types"
import { getRepeatingDatesBetween, MAX_FREE_TASKS } from "@element/shared"
import type { ActionFunctionArgs, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import dayjs from "dayjs"
import { z } from "zod"

import { taskItemSelectFields } from "~/components/TaskItem"
import { db } from "~/lib/db.server"
import { getFormDataArray, validateFormData } from "~/lib/form"
import { badRequest, redirect } from "~/lib/remix"
import { getCurrentUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)
  const url = new URL(request.url)
  const backParam = url.searchParams.get("back")
  const forwardParam = url.searchParams.get("forward")
  const elementIds = url.searchParams.getAll("elementId")

  if (!backParam || !forwardParam) return json([])
  const tasks = await db.task.findMany({
    select: taskItemSelectFields,
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
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  const formData = await request.formData()

  const action = formData.get("_action") as TasksActionMethods | undefined

  switch (action) {
    case TasksActionMethods.AddTask:
      try {
        if (!user.stripeSubscriptionId) {
          const taskCount = await db.task.count({ where: { creatorId: { equals: user.id } } })
          if (taskCount >= MAX_FREE_TASKS) return redirect("/timeline/profile/plan/limit-task")
        }
        if (dayjs(user.createdAt).isBefore(dayjs().subtract(1, "month")) && !user.verifiedAt) {
          return redirect("/timeline/profile", request, {
            flash: {
              title: "Please verify your account",
              description: "You can resend an email if you haven't received one.",
            },
          })
        }
        const createSchema = z
          .object({
            name: z.string(),
            elementId: z.string().uuid(),
            date: z
              .preprocess((d) => (d ? dayjs(d as string).toDate() : undefined), z.date(), {
                errorMap: () => ({ message: "Invalid date" }),
              })
              .nullable()
              .optional(),
            description: z.string().optional().nullable(),
            repeat: z
              .nativeEnum(TaskRepeat, { errorMap: () => ({ message: "Incorrect repeat value" }) })
              .optional()
              .nullable(),
            repeatEndDate: z
              .preprocess((d) => (d ? dayjs(d as string).toDate() : undefined), z.date())
              .optional()
              .nullable(),
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
          .superRefine((data, ctx) => {
            if (!!data.repeat && !data.repeatEndDate)
              return ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "End date is required when repeating tasks",
                path: ["repeatEndDate"],
              })
            if (!!data.repeat && !data.date)
              return ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Date is required when repeating tasks",
                path: ["date"],
              })
          })

        const { data, fieldErrors } = await validateFormData(createSchema, formData)
        if (fieldErrors) return badRequest({ data, fieldErrors })

        const todos = getFormDataArray(formData, "todos").map((t) => ({
          name: t.name as string,
          isComplete: !!t.isComplete,
        }))
        const prevTask = await db.task.findFirst({
          where: {
            creatorId: { equals: user.id },
            date: { equals: data.date },
          },
          orderBy: { order: "desc" },
        })

        const newTask = await db.$transaction(async (transaction) => {
          const task = await transaction.task.create({
            select: { ...taskItemSelectFields, todos: { select: { ...taskItemSelectFields.todos.select, name: true } } },
            data: {
              order: prevTask ? prevTask.order + 1 : 0,
              repeat: data.repeat || null,
              isComplete: formData.has("isComplete") ? formData.get("isComplete") !== "false" : false,
              isImportant: formData.get("isImportant") === "true",
              durationHours: data.durationHours || null,
              durationMinutes: data.durationMinutes || null,
              startTime: data.startTime || null,
              date: data.date ? dayjs(data.date).startOf("d").add(12, "h").toDate() : null,
              name: data.name,
              description: data.description || null,
              element: { connect: { id: data.elementId } },
              creator: { connect: { id: user.id } },
              todos: { createMany: { data: todos } },
            },
          })
          if (task.date && data.repeat && data.repeatEndDate) {
            const repeatEndDate = dayjs(data.repeatEndDate).startOf("d").add(12, "h").toDate()
            const dates = getRepeatingDatesBetween(task.date, repeatEndDate, data.repeat)
            await Promise.all(
              dates.map((date) =>
                transaction.task.create({
                  data: {
                    repeatParent: { connect: { id: task.id } },
                    isComplete: false,
                    isImportant: task.isImportant,
                    durationHours: task.durationHours,
                    durationMinutes: task.durationMinutes,
                    startTime: task.startTime,
                    date,
                    creator: { connect: { id: user.id } },
                    name: task.name,
                    description: task.description,
                    element: { connect: { id: task.element.id } },
                    todos: { createMany: { data: task.todos.map((t) => ({ name: t.name, isComplete: t.isComplete })) } },
                  },
                }),
              ),
            )
          }
          return task
        })
        return json({ task: newTask })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
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
