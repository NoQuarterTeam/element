import { Prisma } from "@element/database"
import { TRPCError } from "@trpc/server"
import dayjs from "dayjs"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const timelineTaskFields = {
  id: true,
  isComplete: true,
  description: true,
  durationHours: true,
  durationMinutes: true,
  startTime: true,
  order: true,
  date: true,
  name: true,
  element: { select: { id: true, name: true, color: true } },
} satisfies Prisma.TaskSelect

const nullableString = z.preprocess((v) => (v === "" ? null : v), z.string().nullable()).optional()
const nullableNumber = z.preprocess((v) => (v === 0 ? null : v), z.number().nullable()).optional()

const taskSchema = z.object({
  name: z.string().min(1, { message: "Please enter a name" }),
  elementId: z.string().min(1, { message: "Please select an element" }),
  date: nullableString,
  description: nullableString,
  startTime: nullableString,
  durationHours: nullableNumber,
  durationMinutes: nullableNumber,
})

const updateSchema = taskSchema.merge(
  z.object({
    name: z.string().min(1, { message: "Please enter a name" }).optional(),
    elementId: z.string().min(1, { message: "Please select an element" }).optional(),
  }),
)

export const taskRouter = createTRPCRouter({
  byDate: protectedProcedure.input(z.object({ date: z.date() })).query(async ({ input: { date }, ctx }) => {
    const endOfDay = dayjs(date).endOf("day").add(20, "days").toDate()
    const tasks = await ctx.prisma.task.findMany({
      select: timelineTaskFields,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      where: { creatorId: { equals: ctx.user.id }, date: { gt: date, lte: endOfDay } },
    })
    const groupedTasks = tasks.reduce<{ [key: string]: (typeof tasks)[number][] }>((acc, task) => {
      const date = dayjs(task.date).format("YYYY-MM-DD")
      if (!acc[date]) acc[date] = []
      acc[date].push(task)
      return acc
    }, {})
    return tasks.map((task) => ({
      ...task,
      // get real order in case there are gaps created by deleted tasks or similar orders after a duplicate
      order: task.date ? groupedTasks[dayjs(task.date).format("YYYY-MM-DD")].findIndex((t) => t.id === task.id) : task.order,
      date: dayjs(task.date).format("YYYY-MM-DD"),
    }))
  }),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input: { id } }) => {
    return ctx.prisma.task.findUnique({ where: { id }, select: timelineTaskFields })
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
  create: protectedProcedure.input(taskSchema).mutation(async ({ ctx, input }) => {
    const data = input
    const date = data.date ? dayjs(data.date).startOf("d").add(12, "hours").toDate() : undefined
    const lastTask = await ctx.prisma.task.findFirst({ where: { creatorId: ctx.user.id, date }, orderBy: { order: "desc" } })
    return ctx.prisma.task.create({
      select: timelineTaskFields,
      data: { ...data, date, order: lastTask ? lastTask.order + 1 : 0, creatorId: ctx.user.id },
    })
  }),
  update: protectedProcedure
    .input(updateSchema.merge(z.object({ id: z.string() })))
    .mutation(({ ctx, input: { id, ...data } }) => {
      const date = data.date ? dayjs(data.date).startOf("d").add(12, "hours").toDate() : data.date
      return ctx.prisma.task.update({ where: { id }, select: timelineTaskFields, data: { ...data, date } })
    }),
  duplicate: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input: { id } }) => {
    const taskToDupe = await ctx.prisma.task.findUniqueOrThrow({ where: { id }, include: { todos: true } })
    return ctx.prisma.task.create({
      data: {
        ...taskToDupe,
        repeat: null,
        createdAt: undefined,
        updatedAt: undefined,
        todos: { createMany: { data: taskToDupe.todos.map((t) => ({ name: t.name, isComplete: t.isComplete })) } },
        id: undefined,
      },
    })
  }),
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input: { id } }) => {
    const task = await ctx.prisma.task.findFirst({ where: { id, creatorId: { equals: ctx.user.id } } })
    if (!task) throw new TRPCError({ code: "NOT_FOUND" })
    await ctx.prisma.task.delete({ where: { id } })
    return true
  }),
})
