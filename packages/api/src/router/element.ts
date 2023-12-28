import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

const elementSchema = z.object({
  name: z.string(),
  color: z.string(),
  parentId: z.string().optional(),
  archivedAt: z.date().optional(),
})

export const elementRouter = createTRPCRouter({
  all: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.element.findMany({
      where: { creatorId: { equals: ctx.user.id }, archivedAt: null },
      orderBy: { createdAt: "desc" },
    })
  }),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.prisma.element.findUnique({ where: { id: input.id, creatorId: { equals: ctx.user.id } } })
  }),
  create: protectedProcedure.input(elementSchema).mutation(({ ctx, input }) => {
    return ctx.prisma.element.create({ data: { ...input, creatorId: ctx.user.id } })
  }),
  update: protectedProcedure
    .input(elementSchema.partial().merge(z.object({ id: z.string() })))
    .mutation(({ ctx, input: { id, ...input } }) => {
      const element = ctx.prisma.element.findUnique({ where: { id, creatorId: { equals: ctx.user.id } } })
      if (!element) throw new TRPCError({ code: "NOT_FOUND", message: "Element not found" })
      return ctx.prisma.element.update({ where: { id }, data: { ...input, creatorId: ctx.user.id } })
    }),
})
