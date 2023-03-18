import { TRPCError } from "@trpc/server"
import { z } from "zod"
import bcrypt from "bcrypt"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import { createAuthToken } from "../lib/jwt"
import { createImageUrl } from "../lib/s3"

export const authRouter = createTRPCRouter({
  me: publicProcedure.query(({ ctx }) => (ctx.user ? { ...ctx.user, avatar: createImageUrl(ctx.user.avatar) } : null)),
  login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string() })).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
    if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "Incorrect email or password" })
    const isSamePassword = bcrypt.compareSync(input.password, user.password)
    if (!isSamePassword) throw new TRPCError({ code: "BAD_REQUEST", message: "Incorrect email or password" })
    const token = createAuthToken({ id: user.id })
    return { user: { ...user, avatar: createImageUrl(user.avatar) }, token }
  }),
  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
      })
      return { ...user, avatar: createImageUrl(user.avatar) }
    }),
})
