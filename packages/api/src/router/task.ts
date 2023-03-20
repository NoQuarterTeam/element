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

export const taskRouter = createTRPCRouter({
  byDate: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
    const startOfDay = dayjs(input).startOf("day").toDate()
    const endOfDay = dayjs(input).endOf("day").toDate()
    return ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } }).tasks({
      select: timelineTaskFields,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      where: { date: { gte: startOfDay, lte: endOfDay } },
    })
  }),
  byId: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.task.findUnique({ where: { id: input }, select: timelineTaskFields })
  }),
  toggleComplete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const id = input
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
  update: protectedProcedure.input(taskSchema.merge(z.object({ id: z.string() }))).mutation(({ ctx, input: { id, ...data } }) => {
    const date = data.date ? dayjs(data.date).startOf("d").add(12, "hours").toDate() : undefined
    return ctx.prisma.task.update({ where: { id }, select: timelineTaskFields, data: { ...data, date } })
  }),
})
