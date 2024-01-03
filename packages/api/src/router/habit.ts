import { TRPCError } from "@trpc/server"
import dayjs from "dayjs"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { habitSchema, updateHabitSchema } from "@element/server-schemas"
import { createHabitReminder, deleteHabitReminder } from "@element/server-services"

export const habitRouter = createTRPCRouter({
  progressCompleteToday: protectedProcedure.query(async ({ ctx }) => {
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
  today: protectedProcedure.query(async ({ ctx }) => {
    const today = dayjs().toDate()
    const [habits, habitEntries] = await Promise.all([
      ctx.prisma.habit.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, reminderTime: true, startDate: true, archivedAt: true },
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
            gte: dayjs(today).startOf("day").toDate(),
            lte: dayjs(today).endOf("day").toDate(),
          },
        },
      }),
    ])
    return { habits, habitEntries }
  }),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const habit = await ctx.prisma.habit.findFirst({ where: { id: input.id, creatorId: { equals: ctx.user.id } } })
    if (!habit) throw new TRPCError({ code: "NOT_FOUND" })
    return habit
  }),
  create: protectedProcedure.input(habitSchema.pick({ name: true, reminderTime: true })).mutation(async ({ ctx, input }) => {
    const startDate = dayjs().startOf("day").add(12, "h").toDate()
    const habit = await ctx.prisma.habit.create({ data: { ...input, startDate, creatorId: ctx.user.id } })
    if (input.reminderTime) {
      const schedule = await createHabitReminder(habit)
      // TODO: handle error
      if (!schedule) return
      await ctx.prisma.habit.update({ where: { id: habit.id }, data: { reminderScheduleId: schedule.scheduleId } })
    }
    return habit
  }),
  update: protectedProcedure
    .input(updateHabitSchema.merge(z.object({ id: z.string() })))
    .mutation(async ({ ctx, input: { id, ...data } }) => {
      const habit = await ctx.prisma.habit.findUnique({ where: { id, creatorId: { equals: ctx.user.id } } })
      if (!habit) throw new TRPCError({ code: "NOT_FOUND" })
      let reminderScheduleId = habit.reminderScheduleId
      console.log("-----------------------------------------------------------")

      console.log({ data })

      if (data.reminderTime === null && habit.reminderScheduleId) await deleteHabitReminder(habit.reminderScheduleId)

      if (data.reminderTime && habit.reminderTime !== data.reminderTime) {
        if (habit.reminderScheduleId) await deleteHabitReminder(habit.reminderScheduleId)
        const schedule = await createHabitReminder(habit)
        // TODO: handle error
        if (!schedule) return
        reminderScheduleId = schedule.scheduleId
      }
      return ctx.prisma.habit.update({ where: { id }, data: { ...data, reminderScheduleId } })
    }),
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const habit = await ctx.prisma.habit.findFirst({ where: { id: input.id, creatorId: { equals: ctx.user.id } } })
    if (!habit) throw new TRPCError({ code: "NOT_FOUND" })

    if (habit.reminderScheduleId) await deleteHabitReminder(habit.reminderScheduleId)

    return ctx.prisma.habit.delete({ where: { id: habit.id } })
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
