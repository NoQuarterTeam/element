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
  byDate: protectedProcedure.input(z.object({ date: z.string() })).query(({ input: { date }, ctx }) => {
    const startOfDay = dayjs(date).startOf("day").toDate()
    const endOfDay = dayjs(date).endOf("day").toDate()
    return ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } }).tasks({
      select: timelineTaskFields,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      where: { date: { gte: startOfDay, lte: endOfDay } },
    })
  }),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input: { id } }) => {
    return ctx.prisma.task.findUnique({ where: { id }, select: timelineTaskFields })
  }),
  toggleComplete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input: { id } }) => {
    const task = await ctx.prisma.task.findUnique({ where: { id } })
    if (!task) throw new TRPCError({ code: "NOT_FOUND" })
    return ctx.prisma.task.update({ where: { id }, data: { isComplete: !task.isComplete } })
  }),
  updateOrder: protectedProcedure.input(z.array(z.string())).mutation(async ({ ctx, input }) => {
    const ids = input
    await Promise.all(ids.map((id, order) => ctx.prisma.task.update({ where: { id }, data: { order } })))
    return true
  }),
  create: protectedProcedure.input(taskSchema).mutation(({ ctx, input }) => {
    const data = input
    const date = data.date ? dayjs(data.date).startOf("d").add(12, "hours").toDate() : undefined
    return ctx.prisma.task.create({ select: timelineTaskFields, data: { ...data, date, creatorId: ctx.user.id } })
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
