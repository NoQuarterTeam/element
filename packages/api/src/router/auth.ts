import { TRPCError } from "@trpc/server"
import { faker } from "@faker-js/faker"
import { z } from "zod"
import bcrypt from "bcrypt"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import { createAuthToken } from "../lib/jwt"
import { createImageUrl } from "../lib/s3"
import { stripe } from "../lib/stripe"
import { hashPassword } from "../lib/password"
import { createTemplates } from "../lib/templates"

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
  registerTempAccount: publicProcedure.mutation(async ({ ctx }) => {
    const firstName = faker.name.firstName()
    const lastName = faker.name.lastName()
    const email = `${firstName}.${lastName}${new Date().getMilliseconds()}@myelement.app`.toLowerCase()
    const password = await hashPassword(faker.internet.password())
    const data = {
      firstName,
      lastName,
      email,
      password,
    }
    const stripeCustomer = await stripe.customers.create({
      email,
      name: firstName + " " + lastName,
    })
    const user = await ctx.prisma.user.create({ data: { ...data, stripeCustomerId: stripeCustomer.id } })
    const elements = createTemplates(user.id)
    for await (const element of elements) {
      await ctx.prisma.element.create({ data: element })
    }
    return { user: { ...user, avatar: createImageUrl(user.avatar) }, token: createAuthToken({ id: user.id }) }
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
  myPlan: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user
    const [taskCount, elementCount, subscription] = await Promise.all([
      !user.stripeSubscriptionId
        ? ctx.prisma.task.count({
            where: { creatorId: { equals: user.id } },
          })
        : null,
      !user.stripeSubscriptionId
        ? ctx.prisma.element.count({
            where: { archivedAt: { equals: null }, creatorId: { equals: user.id } },
          })
        : null,
      user.stripeSubscriptionId ? stripe.subscriptions.retrieve(user.stripeSubscriptionId) : null,
    ])
    const filteredSubscription = subscription
      ? {
          id: subscription.id,
          discountPercent: subscription.discount?.coupon.percent_off,
          isCancelled: subscription.cancel_at_period_end,
          endDate: subscription.current_period_end || 0,
          status: subscription.status,
        }
      : null
    return { taskCount, elementCount, subscription: filteredSubscription }
  }),
})
