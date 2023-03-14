import { TRPCError } from "@trpc/server"
import dayjs from "dayjs"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const taskRouter = createTRPCRouter({
  byDate: protectedProcedure.input(z.string()).query(({ input, ctx }) => {
    const startOfDay = dayjs(input).startOf("day").toDate()
    const endOfDay = dayjs(input).endOf("day").toDate()
    return ctx.prisma.user.findUnique({ where: { id: ctx.user.id } }).tasks({
      select: { id: true, isComplete: true, date: true, name: true, element: { select: { name: true, color: true } } },
      orderBy: { order: "asc" },
      where: { date: { gte: startOfDay, lte: endOfDay } },
    })
  }),
  byId: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.task.findUnique({ where: { id: input } })
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
})
