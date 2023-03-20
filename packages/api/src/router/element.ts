import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const elementRouter = createTRPCRouter({
  all: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.element.findMany({ where: { creatorId: { equals: ctx.user.id } } })
  }),
  create: protectedProcedure.input(z.object({ name: z.string(), color: z.string() })).mutation(({ ctx, input }) => {
    return ctx.prisma.element.create({ data: { ...input, creatorId: ctx.user.id } })
  }),
})
