import { TRPCError } from "@trpc/server"
import dayjs from "dayjs"
import { z } from "zod"

import type { Prisma } from "@element/database/types"
import { taskSchema, todoSchema } from "@element/server-schemas"
import { MAX_FREE_TASKS, getRepeatingDatesBetween } from "@element/shared"

import { createTaskReminder, deleteTaskReminder } from "@element/server-services"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const taskItemSelectFields = {
  id: true,
  createdAt: true,
  name: true,
  description: true,
  reminder: true,
  durationHours: true,
  durationMinutes: true,
  date: true,
  isComplete: true,
  isImportant: true,
  repeat: true,
  repeatParentId: true,
  order: true,
  startTime: true,
  element: { select: { id: true, color: true, name: true } },
  todos: { orderBy: { createdAt: "asc" }, select: { id: true, isComplete: true, name: true } },
} satisfies Prisma.TaskSelect

export const taskRouter = createTRPCRouter({
  timeline: protectedProcedure
    .input(z.object({ daysBack: z.number(), daysForward: z.number() }))
    .query(async ({ input, ctx }) => {
      const startOfDay = dayjs().subtract(input.daysBack, "days").startOf("day").toDate()
      const endOfDay = dayjs().startOf("day").add(12, "hours").add(input.daysForward, "days").toDate()
      const tasks = await ctx.prisma.task.findMany({
        select: taskItemSelectFields,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        where: {
          creatorId: { equals: ctx.user.id },
          element: { archivedAt: null },
          date: { not: null, gt: startOfDay, lt: endOfDay },
        },
      })
      const groupedTasks = tasks.reduce<{ [key: string]: (typeof tasks)[number][] }>((acc, task) => {
        const date = dayjs(task.date).startOf("day").format("YYYY-MM-DD")
        if (!acc[date]) acc[date] = []
        acc[date]?.push(task)
        return acc
      }, {})
      return tasks.map((task) => ({
        ...task,
        // get real order in case there are gaps created by deleted tasks or similar orders after a duplicate, ideally each action would be in charge of making sure the order is correct
        order: task.date
          ? groupedTasks[dayjs(task.date).startOf("day").add(12, "hours").format("YYYY-MM-DD")]!.findIndex(
              (t) => t.id === task.id,
            ) || 0
          : task.order,
        date: dayjs(task.date).startOf("day").add(12, "hours").format("YYYY-MM-DD"),
      }))
    }),
  backlog: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.prisma.task.findMany({
      select: taskItemSelectFields,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      where: { creatorId: { equals: ctx.user.id }, date: null },
    })
    return tasks.map((task) => ({ ...task, date: dayjs(task.date).startOf("day").add(12, "hours").format("YYYY-MM-DD") }))
  }),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input: { id } }) => {
    const task = await ctx.prisma.task.findUnique({
      where: { id },
      select: taskItemSelectFields,
    })
    if (!task) throw new TRPCError({ code: "NOT_FOUND" })
    return { ...task, date: task.date ? dayjs(task.date).startOf("day").add(12, "hours").format("YYYY-MM-DD") : null }
  }),
  toggleComplete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input: { id } }) => {
    const task = await ctx.prisma.task.findUnique({ where: { id } })
    if (!task) throw new TRPCError({ code: "NOT_FOUND" })
    return ctx.prisma.task.update({ where: { id }, data: { isComplete: !task.isComplete } })
  }),
  updateOrder: protectedProcedure
    .input(z.array(z.object({ id: z.string(), order: z.number(), date: z.string() })))
    .mutation(async ({ ctx, input }) => {
      const tasks = input
      await Promise.all(
        tasks.map((task) =>
          ctx.prisma.task.update({
            where: { id: task.id },
            data: { order: task.order, date: dayjs(task.date).startOf("day").add(12, "hours").toDate() },
          }),
        ),
      )
      return true
    }),
  create: protectedProcedure
    .input(
      taskSchema.merge(z.object({ repeatEndDate: z.date().nullish(), todos: z.array(todoSchema) })).superRefine((data, ctx) => {
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
      }),
    )
    .mutation(async ({ ctx, input: { todos, repeatEndDate, ...data } }) => {
      let taskCount: number
      if (ctx.user.role !== "ADMIN" && !ctx.user.stripeSubscriptionId) {
        taskCount = await ctx.prisma.task.count({ where: { creatorId: { equals: ctx.user.id } } })
        if (taskCount >= MAX_FREE_TASKS)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have reached the maximum number of tasks for the free plan. Please upgrade to add more.",
          })
      }

      const date = data.date ? dayjs(data.date).startOf("day").add(12, "hours").toDate() : undefined
      const lastTask = await ctx.prisma.task.findFirst({
        select: { order: true },
        where: { creatorId: ctx.user.id, date },
        orderBy: { order: "desc" },
      })
      const newTask = await ctx.prisma.$transaction(async (transaction) => {
        const task = await transaction.task.create({
          select: taskItemSelectFields,
          data: {
            ...data,
            todos: { createMany: { data: todos } },
            date,
            order: lastTask ? lastTask.order + 1 : 0,
            creatorId: ctx.user.id,
          },
        })

        if (task.date && data.repeat && repeatEndDate && ctx.user.stripeSubscriptionId) {
          const repeatEndDateAsDate = dayjs(repeatEndDate).startOf("day").add(12, "hours").toDate()
          const dates = getRepeatingDatesBetween(task.date, repeatEndDateAsDate, data.repeat)
          if (dates.length > 200) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Can only create max. 200 tasks" })
          }
          if (dates.length + taskCount > MAX_FREE_TASKS) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum number of tasks reached." })
          }
          await Promise.all(
            dates.map(async (date) => {
              const copiedTask = await transaction.task.create({
                data: {
                  repeatParent: { connect: { id: task.id } },
                  isComplete: false,
                  isImportant: task.isImportant,
                  durationHours: task.durationHours,
                  durationMinutes: task.durationMinutes,
                  startTime: task.startTime,
                  date,
                  creator: { connect: { id: ctx.user.id } },
                  name: task.name,
                  description: task.description,
                  element: { connect: { id: task.element.id } },
                  todos: { createMany: { data: task.todos.map((t) => ({ name: t.name, isComplete: t.isComplete })) } },
                },
              })
              return copiedTask
            }),
          )
        }
        return task
      })
      if (newTask.reminder) {
        const upstashMessageId = await createTaskReminder(newTask)
        if (!upstashMessageId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error creating reminder" })
        await ctx.prisma.task.update({ where: { id: newTask.id }, data: { upstashMessageId } })
      }

      return {
        ...newTask,
        date: dayjs(newTask.date).startOf("day").add(12, "hours").format("YYYY-MM-DD"),
      }
    }),
  update: protectedProcedure
    .input(taskSchema.partial().merge(z.object({ id: z.string(), todos: z.array(todoSchema).optional() })))
    .mutation(async ({ ctx, input: { id, todos, ...data } }) => {
      // date can be set to null or be undefined,
      const date = data.date ? dayjs(data.date).startOf("day").add(12, "hours").toDate() : data.date
      const existingTask = await ctx.prisma.task.findUnique({ where: { id, creatorId: { equals: ctx.user.id } } })
      if (!existingTask) throw new TRPCError({ code: "NOT_FOUND" })
      const task = await ctx.prisma.task.update({
        where: { id },
        select: { ...taskItemSelectFields, upstashMessageId: true },
        data: { ...data, todos: todos ? { deleteMany: {}, createMany: { data: todos } } : undefined, date },
      })

      if (!task.reminder && task.upstashMessageId) {
        await deleteTaskReminder(task.upstashMessageId)
        await ctx.prisma.task.update({ where: { id }, data: { upstashMessageId: null } })
      }
      if (
        (data.reminder && existingTask.reminder !== data.reminder) ||
        (data.startTime && data.startTime !== existingTask.startTime)
      ) {
        if (task.upstashMessageId) await deleteTaskReminder(task.upstashMessageId)
        const upstashMessageId = await createTaskReminder(task)
        if (!upstashMessageId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error creating reminder" })
        await ctx.prisma.task.update({ where: { id }, data: { upstashMessageId } })
      }
      return {
        ...task,
        date: task.date ? dayjs(task.date).startOf("day").add(12, "hours").format("YYYY-MM-DD") : null,
      }
    }),
  duplicate: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input: { id } }) => {
    if (ctx.user.role !== "ADMIN" && !ctx.user.stripeSubscriptionId) {
      const taskCount = await ctx.prisma.task.count({ where: { creatorId: { equals: ctx.user.id } } })
      if (taskCount >= MAX_FREE_TASKS) throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum number of tasks reached." })
    }

    const taskToDupe = await ctx.prisma.task.findUniqueOrThrow({ where: { id }, include: { todos: true } })
    const dayTasks = await ctx.prisma.task.count({ where: { creatorId: ctx.user.id, date: { equals: taskToDupe.date } } })

    const task = await ctx.prisma.task.create({
      select: taskItemSelectFields,
      data: {
        ...taskToDupe,
        order: dayTasks + 1,
        repeat: null,
        createdAt: undefined,
        updatedAt: undefined,
        todos: { createMany: { data: taskToDupe.todos.map((t) => ({ name: t.name, isComplete: t.isComplete })) } },
        id: undefined,
      },
    })
    return { ...task, date: task.date ? dayjs(task.date).startOf("day").add(12, "hours").format("YYYY-MM-DD") : null }
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.string(), shouldDeleteFuture: z.boolean().optional() }))
    .mutation(async ({ ctx, input: { id, shouldDeleteFuture } }) => {
      const task = await ctx.prisma.task.findFirst({ where: { id, creatorId: { equals: ctx.user.id } } })
      if (!task) throw new TRPCError({ code: "NOT_FOUND" })

      await ctx.prisma.$transaction(async (transaction) => {
        if (shouldDeleteFuture && task.date) {
          await transaction.task.deleteMany({
            where: { repeatParentId: { equals: task.repeat ? task.id : task.repeatParentId }, date: { gt: task.date } },
          })
        }
        await transaction.task.delete({ where: { id } })
      })
      return true
    }),
})
