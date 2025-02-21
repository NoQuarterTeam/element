import { TRPCError } from "@trpc/server"
import dayjs from "dayjs"
import { z } from "zod"

import { habitReminderSchema, habitSchema, updateHabitSchema } from "@element/server-schemas"
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
        select: { id: true, name: true, order: true, reminders: true, startDate: true, archivedAt: true },
        where: {
          OR: [{ archivedAt: { equals: null } }, { archivedAt: { gte: dayjs(date).endOf("day").toDate() } }],
          createdAt: { lte: dayjs(date).endOf("day").toDate() },
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
    const habit = await ctx.prisma.habit.findFirst({
      where: { id: input.id, creatorId: { equals: ctx.user.id } },
      include: { reminders: { orderBy: { time: "asc" } } },
    })
    if (!habit) throw new TRPCError({ code: "NOT_FOUND" })
    return habit
  }),
  create: protectedProcedure
    .input(habitSchema.merge(z.object({ reminders: z.array(habitReminderSchema).optional() })))
    .mutation(async ({ ctx, input: { reminders, ...input } }) => {
      const startDate = dayjs().startOf("day").add(12, "hours").toDate()
      const lastHabit = await ctx.prisma.habit.findFirst({
        where: { archivedAt: null, creatorId: { equals: ctx.user.id } },
        orderBy: { order: "desc" },
      })
      const habit = await ctx.prisma.habit.create({
        data: { ...input, order: lastHabit?.order ? lastHabit.order + 1 : 0, startDate, creatorId: ctx.user.id },
      })
      if (reminders && reminders.length > 0) {
        await Promise.all(
          reminders.map(async (r) => {
            const reminder = await ctx.prisma.habitReminder.create({ data: { ...r, habitId: habit.id } })
            const upstashScheduleId = await createHabitReminder({ id: reminder.id, time: r.time })
            return ctx.prisma.habitReminder.update({ where: { id: reminder.id }, data: { upstashScheduleId } })
          }),
        )
      }
      return habit
    }),
  update: protectedProcedure
    .input(
      updateHabitSchema.merge(
        z.object({
          id: z.string(),
          reminders: z.array(habitReminderSchema.merge(z.object({ id: z.string() }))).optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input: { id, reminders, ...data } }) => {
      const habit = await ctx.prisma.habit.findUnique({
        where: { id, creatorId: { equals: ctx.user.id } },
        include: { reminders: true },
      })
      if (!habit) throw new TRPCError({ code: "NOT_FOUND" })
      if (reminders) {
        const remindersToDelete = habit.reminders.filter(
          (oldReminder) => !reminders.find((newReminder) => newReminder.id === oldReminder.id),
        )
        if (remindersToDelete.length > 0) {
          await ctx.prisma.habitReminder.deleteMany({ where: { id: { in: remindersToDelete.map((r) => r.id) } } })
          await Promise.all(remindersToDelete.map((r) => r.upstashScheduleId && deleteHabitReminder(r.upstashScheduleId)))
        }
        if (reminders.length > 0) {
          await Promise.all(
            reminders.map(async (r) => {
              let reminder = await ctx.prisma.habitReminder.findFirst({ where: { id: r.id } })
              if (reminder) {
                if (r.time === reminder.time) return
                if (reminder.upstashScheduleId) await deleteHabitReminder(reminder.upstashScheduleId)
              } else {
                reminder = await ctx.prisma.habitReminder.create({ data: { ...r, habitId: habit.id } })
              }
              const upstashScheduleId = await createHabitReminder({ id: reminder.id, time: r.time })
              return ctx.prisma.habitReminder.update({ where: { id: r.id }, data: { time: r.time, upstashScheduleId } })
            }),
          )
        }
      }

      return ctx.prisma.habit.update({ where: { id }, data })
    }),
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const habit = await ctx.prisma.habit.findFirst({
      where: { id: input.id, creatorId: { equals: ctx.user.id } },
      include: { reminders: true },
    })
    if (!habit) throw new TRPCError({ code: "NOT_FOUND" })

    await Promise.all(habit.reminders.map((r) => r.upstashScheduleId && deleteHabitReminder(r.upstashScheduleId)))
    await ctx.prisma.habitReminder.deleteMany({ where: { habitId: { equals: habit.id } } })
    return ctx.prisma.habit.delete({ where: { id: habit.id } })
  }),
  stats: protectedProcedure.input(z.object({ startDate: z.date() })).query(async ({ ctx, input }) => {
    const habits = await ctx.prisma.habit.findMany({
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
    const habitEntries = await ctx.prisma.habitEntry.findMany({
      where: { creatorId: ctx.user.id, createdAt: { gte: input.startDate, lte: dayjs().endOf("day").toDate() } },
      select: { id: true, habitId: true, createdAt: true },
    })
    const daysOfWeekStats = habitEntries.reduce<{ [key: number]: number }>((acc, entry) => {
      const dayOfWeek = dayjs(entry.createdAt).day()
      if (!acc[dayOfWeek]) acc[dayOfWeek] = 1
      acc[dayOfWeek]++
      return acc
    }, {})
    return { habits, daysOfWeekStats }
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
  archive: protectedProcedure.input(z.object({ id: z.string(), date: z.date() })).mutation(async ({ ctx, input }) => {
    const habit = await ctx.prisma.habit.update({
      where: { id: input.id },
      data: { archivedAt: dayjs(input.date).startOf("day").add(12, "hours").toDate() },
      include: { reminders: true },
    })
    await ctx.prisma.habitReminder.deleteMany({ where: { habitId: { equals: habit.id } } })
    await Promise.all(habit.reminders.map((r) => r.upstashScheduleId && deleteHabitReminder(r.upstashScheduleId)))
  }),
  toggleComplete: protectedProcedure.input(z.object({ id: z.string(), date: z.date() })).mutation(async ({ ctx, input }) => {
    const date = dayjs(input.date).startOf("day").add(12, "hours").toDate()
    const gte = dayjs(date).startOf("day").toDate()
    const lte = dayjs(date).endOf("day").toDate()
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
