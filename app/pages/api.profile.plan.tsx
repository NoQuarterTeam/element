import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime"
import { redirect } from "@remix-run/server-runtime"
import { typedjson } from "remix-typedjson"
import type { UseDataFunctionReturn } from "remix-typedjson/dist/remix"

import { FlashType, PRICE_ID } from "~/lib/config.server"
import { FULL_WEB_URL } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { badRequest } from "~/lib/remix"
import { stripe } from "~/lib/stripe/stripe.server"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const [taskCount, elementCount, subscription] = await Promise.all([
    !user.stripeSubscriptionId
      ? db.task.count({
          where: { creatorId: { equals: user.id } },
        })
      : null,
    !user.stripeSubscriptionId
      ? db.element.count({
          where: { archivedAt: { equals: null }, creatorId: { equals: user.id } },
        })
      : null,
    user.stripeSubscriptionId ? stripe.subscriptions.retrieve(user.stripeSubscriptionId) : null,
  ])
  return typedjson({ taskCount, elementCount, subscription })
}

export type ProfilePlan = UseDataFunctionReturn<typeof loader>

export enum ProfilePlanMethods {
  JoinPlan = "joinPlan",
  CancelPlan = "cancelPlan",
  ReactivatePlan = "reactivatePlan",
}

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request)
  const { createFlash } = await getFlashSession(request)
  const formData = await request.formData()
  const action = formData.get("_action") as ProfilePlanMethods | undefined
  switch (action) {
    case ProfilePlanMethods.JoinPlan:
      try {
        const promoCode = formData.get("promoCode") as string | undefined
        let promoCodeId
        if (promoCode) {
          const promo = await stripe.promotionCodes.list({ code: promoCode })
          promoCodeId = promo?.data?.[0]?.id
        }
        const session = await stripe.checkout.sessions.create({
          customer: user.stripeCustomerId,
          customer_update: { address: "auto", name: "auto" },
          billing_address_collection: "required",
          tax_id_collection: { enabled: true },
          success_url: FULL_WEB_URL + "/timeline?subscribed",
          cancel_url: FULL_WEB_URL + "/timeline",
          automatic_tax: { enabled: true },
          discounts: promoCode ? [{ promotion_code: promoCodeId }] : undefined,
          line_items: [{ price: PRICE_ID, quantity: 1 }],
          mode: "subscription",
        })
        if (!session.url) return badRequest("Error creating subscription")
        return redirect(session.url)
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error joining plan") },
        })
      }
    case ProfilePlanMethods.CancelPlan:
      try {
        if (!user.stripeSubscriptionId) return badRequest("No subscription")
        await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true })
        return typedjson({ success: true })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error cancelling subscription") },
        })
      }
    case ProfilePlanMethods.ReactivatePlan:
      try {
        if (!user.stripeSubscriptionId) return badRequest("No subscription")
        await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: false })
        return typedjson({ success: true })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error cancelling subscription") },
        })
      }

    default:
      return badRequest("Invalid action", {
        headers: { "Set-Cookie": await createFlash(FlashType.Error, "Invalid action") },
      })
  }
}
