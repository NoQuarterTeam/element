import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const taskRouter = createTRPCRouter({
  all: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.task.findMany({ take: 30, orderBy: { date: "desc" } })
  }),
  byId: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.task.findUnique({ where: { id: input } })
  }),
})
