import { TRPCError } from "@trpc/server"
import dayjs from "dayjs"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const habitRouter = createTRPCRouter({
  progressCompleteToday: protectedProcedure.query(async ({ ctx }) => {
    // return percentage of habits completed on given date
    const habits = await ctx.prisma.habit.findMany({
      include: {
        entries: {
          where: { createdAt: { gte: dayjs().startOf("d").toDate(), lte: dayjs().endOf("d").toDate() } },
        },
      },
      where: {
        OR: [{ archivedAt: { equals: null } }, { archivedAt: { gte: dayjs().endOf("day").toDate() } }],
        startDate: { lt: dayjs().endOf("day").toDate() },
        creatorId: { equals: ctx.user.id },
      },
    })
    const total = habits.length
    const completed = habits.filter((h) => h.entries.length > 0).length
    return { total, progress: Math.round((completed / total) * 100) }
  }),
  all: protectedProcedure.query(async ({ ctx }) => {
    const today = dayjs().toDate()
    const [habits, habitEntries] = await Promise.all([
      ctx.prisma.habit.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, startDate: true, archivedAt: true },
        where: {
          OR: [{ archivedAt: { equals: null } }, { archivedAt: { gte: dayjs(today).endOf("day").toDate() } }],
          startDate: { lt: dayjs(today).endOf("day").toDate() },
          creatorId: { equals: ctx.user.id },
        },
      }),
      ctx.prisma.habitEntry.findMany({
        select: { id: true, habitId: true, createdAt: true },
        where: {
          creatorId: { equals: ctx.user.id },
          createdAt: {
            gte: dayjs(today).startOf("d").toDate(),
            lte: dayjs(today).endOf("d").toDate(),
          },
        },
      }),
    ])
    return { habits, habitEntries }
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1, { message: "Please provide a name" }) }))
    .mutation(({ ctx, input }) => {
      const startDate = dayjs().startOf("day").add(12, "h").toDate()
      return ctx.prisma.habit.create({ data: { ...input, startDate, creatorId: ctx.user.id } })
    }),
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const habit = await ctx.prisma.habit.findFirst({
      select: { id: true },
      where: { id: input.id, creatorId: { equals: ctx.user.id } },
    })
    if (!habit) throw new TRPCError({ code: "NOT_FOUND" })
    return ctx.prisma.habit.delete({ where: { id: habit.id } })
  }),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const habit = await ctx.prisma.habit.findFirst({
      select: { id: true, name: true, startDate: true, archivedAt: true },
      where: { id: input.id, creatorId: { equals: ctx.user.id } },
    })
    if (!habit) throw new TRPCError({ code: "NOT_FOUND" })
    return habit
  }),
  update: protectedProcedure.input(z.object({ id: z.string(), name: z.string() })).mutation(({ ctx, input: { id, ...data } }) => {
    return ctx.prisma.habit.update({ where: { id }, data })
  }),
  archive: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    return ctx.prisma.habit.update({
      where: { id: input.id },
      data: { archivedAt: dayjs().startOf("d").add(12, "h").toDate() },
    })
  }),
  toggleComplete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const date = dayjs().toDate()
    const gte = dayjs().startOf("d").toDate()
    const lte = dayjs().endOf("d").toDate()
    const entries = await ctx.prisma.habitEntry.findMany({
      select: { id: true },
      where: { creatorId: { equals: ctx.user.id }, habitId: { equals: input.id }, createdAt: { gte, lte } },
    })
    if (entries.length > 0) {
      await ctx.prisma.habitEntry.deleteMany({ where: { id: { in: entries.map((e) => e.id) } } })
    } else {
      await ctx.prisma.habitEntry.create({ data: { creatorId: ctx.user.id, habitId: input.id, createdAt: date } })
    }
    return true
  }),
})
