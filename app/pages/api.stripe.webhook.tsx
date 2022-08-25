import { SubscriptionStatus } from "@prisma/client"
import type { ActionArgs } from "@remix-run/server-runtime"
import { badRequest, json } from "remix-utils"
import type Stripe from "stripe"

import { STRIPE_WEBHOOK_SECRET } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import type { StripeEventType } from "~/lib/stripe/stripe.events.server"
import { stripe } from "~/lib/stripe/stripe.server"

const SUBSCRIPTION_STATUS_MAP: { [key in Stripe.Subscription.Status]: SubscriptionStatus } = {
  active: SubscriptionStatus.ACTIVE,
  canceled: SubscriptionStatus.CANCELLED,
  incomplete: SubscriptionStatus.INCOMPLETE,
  trialing: SubscriptionStatus.TRIALING,
  incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
  past_due: SubscriptionStatus.PAST_DUE,
  unpaid: SubscriptionStatus.UNPAID,
}

export const action = async ({ request }: ActionArgs) => {
  const signature = request.headers.get("stripe-signature")
  if (!signature || !request.body) return badRequest("Stripe signature is required")
  const event = stripe.webhooks.constructEvent(await request.text(), signature, STRIPE_WEBHOOK_SECRET)

  switch (event.type as StripeEventType) {
    case "customer.subscription.created":
      try {
        const subscription = event.data.object as Stripe.Subscription
        await db.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: SUBSCRIPTION_STATUS_MAP[subscription.status],
          },
        })
      } catch (error) {
        console.log(error)
      }
      break
    case "customer.subscription.updated":
      try {
        const subscription = event.data.object as Stripe.Subscription
        await db.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: { subscriptionStatus: SUBSCRIPTION_STATUS_MAP[subscription.status] },
        })
      } catch (error) {
        console.log(error)
      }
      break
    case "customer.subscription.deleted":
      try {
        const subscription = event.data.object as Stripe.Subscription
        await db.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: { subscriptionStatus: null, stripeSubscriptionId: null },
        })
      } catch (error) {
        console.log(error)
      }
      break
    default:
      console.log("Unhandled event type")
  }
  return json({ success: true })
}
