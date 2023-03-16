import { createTRPCRouter, protectedProcedure } from "../trpc"

export const elementRouter = createTRPCRouter({
  all: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.element.findMany({ where: { creatorId: { equals: ctx.user.id } } })
  }),
})
