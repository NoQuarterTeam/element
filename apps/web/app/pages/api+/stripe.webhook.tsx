import { env } from "@element/server-env"
import type { ActionFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import type Stripe from "stripe"

import { db } from "~/lib/db.server"
import { badRequest } from "~/lib/remix"
import type { StripeEventType } from "~/lib/stripe/stripe.events.server"
import { stripe } from "~/lib/stripe/stripe.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const signature = request.headers.get("stripe-signature")
  if (!signature || !request.body) return badRequest("Stripe signature is required")
  const event = stripe.webhooks.constructEvent(await request.text(), signature, env.STRIPE_WEBHOOK_SECRET)
  switch (event.type as StripeEventType) {
    case "customer.subscription.created":
      try {
        const subscription = event.data.object as Stripe.Subscription
        await db.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            stripeSubscriptionId: subscription.id,
          },
        })
      } catch (error) {
        console.log(error)
      }
      break
    case "customer.subscription.updated":
      // do nothing for now
      break
    case "customer.subscription.deleted":
      try {
        const subscription = event.data.object as Stripe.Subscription
        await db.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: { stripeSubscriptionId: null },
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
