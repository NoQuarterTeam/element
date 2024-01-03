import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const pushTokenRouter = createTRPCRouter({
  create: protectedProcedure.input(z.object({ token: z.string().min(1) })).mutation(({ ctx, input }) => {
    return ctx.prisma.pushToken.upsert({
      where: { userId_token: { userId: ctx.user.id, token: input.token } },
      create: { token: input.token, user: { connect: { id: ctx.user.id } } },
      update: {},
    })
  }),
})
