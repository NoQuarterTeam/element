import { TRPCError } from "@trpc/server"

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"

import { comparePasswords, createAuthToken, createTemplates, hashPassword, stripe } from "@element/server-services"
import { loginSchema, registerSchema, updateUserSchema } from "@element/server-schemas"

export const userRouter = createTRPCRouter({
  me: publicProcedure.query(({ ctx }) => ctx.user || null),
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
    if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "Incorrect email or password" })
    const isSamePassword = comparePasswords(input.password, user.password)
    if (!isSamePassword) throw new TRPCError({ code: "BAD_REQUEST", message: "Incorrect email or password" })
    const token = createAuthToken({ id: user.id })
    return { user, token }
  }),
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const existingEmail = await ctx.prisma.user.findUnique({ where: { email: input.email } })
    if (existingEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "Email already in use" })
    const password = hashPassword(input.password)
    const stripeCustomer = await stripe.customers.create({
      email: input.email,
      name: input.firstName + " " + input.lastName,
    })
    const user = await ctx.prisma.user.create({ data: { ...input, password, stripeCustomerId: stripeCustomer.id } })
    const elements = createTemplates(user.id)

    for await (const element of elements) {
      await ctx.prisma.element.create({ data: element })
    }
    return { user, token: createAuthToken({ id: user.id }) }
  }),
  update: protectedProcedure.input(updateUserSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.update({ where: { id: ctx.user.id }, data: input })
    return user
  }),
  myPlan: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user
    const [taskCount, elementCount, subscription] = await Promise.all([
      !user.stripeSubscriptionId ? ctx.prisma.task.count({ where: { creatorId: { equals: user.id } } }) : null,
      !user.stripeSubscriptionId
        ? ctx.prisma.element.count({ where: { archivedAt: { equals: null }, creatorId: { equals: user.id } } })
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