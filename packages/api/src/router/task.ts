import { TRPCError } from "@trpc/server"
import dayjs from "dayjs"
import { z } from "zod"

import { type Prisma } from "@element/database/types"
import { taskSchema, todoSchema } from "@element/server-schemas"
import { getRepeatingDatesBetween } from "@element/shared"

import { createTRPCRouter, protectedProcedure } from "../trpc"

const taskItemSelectFields = {
  id: true,
  createdAt: true,
  name: true,
  description: true,
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
      const endOfDay = dayjs().endOf("day").add(input.daysForward, "days").toDate()
      const tasks = await ctx.prisma.task.findMany({
        select: taskItemSelectFields,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        where: {
          creatorId: { equals: ctx.user.id },
          element: { archivedAt: null },
          date: { not: null, gt: startOfDay, lte: endOfDay },
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
    if (!task) return null
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
        if (task.date && data.repeat && repeatEndDate) {
          const repeatEndDateAsDate = dayjs(repeatEndDate).startOf("d").add(12, "h").toDate()
          const dates = getRepeatingDatesBetween(task.date, repeatEndDateAsDate, data.repeat)
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
                  creator: { connect: { id: ctx.user.id } },
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
      return {
        ...newTask,
        date: dayjs(newTask.date).startOf("day").add(12, "hours").format("YYYY-MM-DD"),
      }
    }),
  update: protectedProcedure
    .input(taskSchema.partial().merge(z.object({ id: z.string(), todos: z.array(todoSchema).optional() })))
    .mutation(async ({ ctx, input: { id, todos, ...data } }) => {
      // can be set to null
      const date = data.date ? dayjs(data.date).startOf("day").add(12, "hours").toDate() : data.date
      const task = await ctx.prisma.task.update({
        where: { id },
        select: taskItemSelectFields,
        data: { ...data, todos: todos ? { deleteMany: {}, createMany: { data: todos } } : undefined, date },
      })
      return {
        ...task,
        date: task.date ? dayjs(task.date).startOf("day").add(12, "hours").format("YYYY-MM-DD") : null,
      }
    }),
  duplicate: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input: { id } }) => {
    const taskToDupe = await ctx.prisma.task.findUniqueOrThrow({ where: { id }, include: { todos: true } })
    const task = await ctx.prisma.task.create({
      select: taskItemSelectFields,
      data: {
        ...taskToDupe,
        order: taskToDupe.order + 1,
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
