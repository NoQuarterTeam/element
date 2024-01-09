import { TRPCError } from "@trpc/server"
import dayjs from "dayjs"
import { z } from "zod"

import { habitSchema, updateHabitSchema } from "@element/server-schemas"
import { createHabitReminder, deleteHabitReminder } from "@element/server-services"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const habitRouter = createTRPCRouter({
  progressToday: protectedProcedure.query(async ({ ctx }) => {
    // return percentage of habits completed on given date
    const habits = await ctx.prisma.habit.findMany({
      include: {
        entries: {
          where: { createdAt: { gte: dayjs().startOf("day").toDate(), lte: dayjs().endOf("day").toDate() } },
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
    return Math.round((completed / total) * 100)
  }),
  allByDate: protectedProcedure.input(z.object({ date: z.date() })).query(async ({ input, ctx }) => {
    const date = input.date
    const [habits, habitEntries] = await Promise.all([
      ctx.prisma.habit.findMany({
        orderBy: { order: "asc" },
        select: { id: true, name: true, order: true, reminderTime: true, startDate: true, archivedAt: true },
        where: {
          OR: [{ archivedAt: { equals: null } }, { archivedAt: { gte: dayjs(date).endOf("day").toDate() } }],
          creatorId: { equals: ctx.user.id },
        },
      }),
      ctx.prisma.habitEntry.findMany({
        select: { id: true, habitId: true, createdAt: true },
        where: {
          creatorId: { equals: ctx.user.id },
          createdAt: {
            gte: dayjs(date).startOf("day").toDate(),
            lte: dayjs(date).endOf("day").toDate(),
          },
        },
      }),
    ])
    return { habits: habits.map((h, i) => ({ ...h, order: i })), habitEntries }
  }),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const habit = await ctx.prisma.habit.findFirst({ where: { id: input.id, creatorId: { equals: ctx.user.id } } })
    if (!habit) throw new TRPCError({ code: "NOT_FOUND" })
    return habit
  }),
  create: protectedProcedure.input(habitSchema.pick({ name: true, reminderTime: true })).mutation(async ({ ctx, input }) => {
    const startDate = dayjs().startOf("day").add(12, "h").toDate()
    const lastHabit = await ctx.prisma.habit.findFirst({
      where: { archivedAt: null, creatorId: { equals: ctx.user.id } },
      orderBy: { order: "desc" },
    })
    const habit = await ctx.prisma.habit.create({
      data: { ...input, order: lastHabit?.order ? lastHabit.order + 1 : 0, startDate, creatorId: ctx.user.id },
    })
    if (input.reminderTime) {
      const schedule = await createHabitReminder({ id: habit.id, reminderTime: input.reminderTime, name: habit.name })
      // TODO: handle error
      if (schedule) {
        await ctx.prisma.habit.update({ where: { id: habit.id }, data: { reminderScheduleId: schedule.scheduleId } })
      }
    }
    return habit
  }),
  update: protectedProcedure
    .input(updateHabitSchema.merge(z.object({ id: z.string() })))
    .mutation(async ({ ctx, input: { id, ...data } }) => {
      const habit = await ctx.prisma.habit.findUnique({ where: { id, creatorId: { equals: ctx.user.id } } })
      if (!habit) throw new TRPCError({ code: "NOT_FOUND" })
      let reminderScheduleId = habit.reminderScheduleId
      if (data.reminderTime === null && habit.reminderScheduleId) await deleteHabitReminder(habit.reminderScheduleId)

      if (data.reminderTime && habit.reminderTime !== data.reminderTime) {
        if (habit.reminderScheduleId) await deleteHabitReminder(habit.reminderScheduleId)
        const schedule = await createHabitReminder({ id: habit.id, reminderTime: data.reminderTime, name: habit.name })
        // TODO: handle error
        if (schedule) {
          reminderScheduleId = schedule.scheduleId
        }
      }
      return ctx.prisma.habit.update({ where: { id }, data: { ...data, reminderScheduleId } })
    }),
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const habit = await ctx.prisma.habit.findFirst({ where: { id: input.id, creatorId: { equals: ctx.user.id } } })
    if (!habit) throw new TRPCError({ code: "NOT_FOUND" })

    if (habit.reminderScheduleId) await deleteHabitReminder(habit.reminderScheduleId)

    return ctx.prisma.habit.delete({ where: { id: habit.id } })
  }),
  stats: protectedProcedure.input(z.object({ startDate: z.date() })).query(async ({ ctx, input }) => {
    return ctx.prisma.habit.findMany({
      where: { creatorId: ctx.user.id, archivedAt: { equals: null } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        archivedAt: true,
        _count: { select: { entries: { where: { createdAt: { gte: input.startDate, lte: dayjs().endOf("day").toDate() } } } } },
      },
    })
  }),
  updateOrder: protectedProcedure
    .input(z.array(z.object({ id: z.string(), order: z.number() })))
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.map((i) => {
          return ctx.prisma.habit.update({ where: { id: i.id }, data: { order: i.order } }).catch()
        }),
      )
      return true
    }),
  archive: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const habit = await ctx.prisma.habit.update({
      where: { id: input.id },
      data: { archivedAt: dayjs().startOf("day").add(12, "h").toDate() },
    })
    if (habit.reminderScheduleId) await deleteHabitReminder(habit.reminderScheduleId)
  }),
  toggleComplete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const date = dayjs().toDate()
    const gte = dayjs().startOf("day").toDate()
    const lte = dayjs().endOf("day").toDate()
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
