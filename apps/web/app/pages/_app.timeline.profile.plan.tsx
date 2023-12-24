import { env, FULL_WEB_URL } from "@element/server-env"
import { join, MAX_FREE_ELEMENTS, MAX_FREE_TASKS, useDisclosure } from "@element/shared"
import type { ActionFunctionArgs, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { Outlet, useFetcher, useLoaderData } from "@remix-run/react"
import dayjs from "dayjs"

import { AlertDialog } from "~/components/ui/AlertDialog"
import { Button } from "~/components/ui/Button"
import { ButtonGroup } from "~/components/ui/ButtonGroup"
import { Form, FormButton } from "~/components/ui/Form"
import { Input } from "~/components/ui/Inputs"
import { Modal } from "~/components/ui/Modal"

import { db } from "~/lib/db.server"
import { badRequest } from "~/lib/remix"
import { stripe } from "~/lib/stripe/stripe.server"
import { getCurrentUser } from "~/services/auth/auth.server"
import { FlashType, getFlashSession } from "~/services/session/flash.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)
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
  const filteredSubscription = subscription
    ? {
        id: subscription.id,
        discountPercent: subscription.discount?.coupon.percent_off,
        isCancelled: subscription.cancel_at_period_end,
        endDate: subscription.current_period_end || 0,
        status: subscription.status,
      }
    : null

  return json({ taskCount, elementCount, subscription: filteredSubscription })
}

export type ProfilePlan = SerializeFrom<typeof loader>

export enum ProfilePlanMethods {
  JoinPlan = "joinPlan",
  CancelPlan = "cancelPlan",
  ReactivatePlan = "reactivatePlan",
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
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
          success_url: FULL_WEB_URL + "/timeline/subscribed",
          cancel_url: FULL_WEB_URL + "/timeline/profile/plan",
          automatic_tax: { enabled: true },
          discounts: promoCode ? [{ promotion_code: promoCodeId }] : undefined,
          line_items: [{ price: env.PRICE_ID, quantity: 1 }],
          mode: "subscription",
        })
        if (!session.url) return badRequest("Error creating subscription")
        return redirect(session.url)
      } catch (e: any) {
        return badRequest(e.message)
      }
    case ProfilePlanMethods.CancelPlan:
      try {
        if (!user.stripeSubscriptionId) return badRequest("No subscription")
        await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true })
        return json({ success: true })
      } catch (e: any) {
        return badRequest(e.message)
      }
    case ProfilePlanMethods.ReactivatePlan:
      try {
        if (!user.stripeSubscriptionId) return badRequest("No subscription")
        await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: false })
        return json({ success: true })
      } catch (e: any) {
        return badRequest(e.message)
      }

    default:
      return badRequest("Invalid action")
  }
}

export default function Plan() {
  const data = useLoaderData<typeof loader>()
  const joinPlanProps = useDisclosure()

  const cancelFetcher = useFetcher()

  const discountedPlanAmount = data?.subscription?.discountPercent ? 4 - (4 * 100) / data.subscription.discountPercent : null

  return (
    <div className="stack">
      <p className="text-lg font-medium">Plan</p>
      <Outlet />
      {data?.subscription ? (
        <div className="stack">
          <p className="text-lg">
            You are currently on the <b>Pro</b> plan
          </p>
          {discountedPlanAmount || discountedPlanAmount === 0 ? (
            <p className="text-sm">
              A {data?.subscription.discountPercent}% discount is applied to your subscription, you pay €{discountedPlanAmount}{" "}
              per month
            </p>
          ) : null}
          {data.subscription.isCancelled ? (
            <p className="text-sm">
              You have cancelled but still have access to Pro features until{" "}
              <b>{dayjs.unix(data.subscription.endDate).format("DD/MM/YYYY")}</b>
            </p>
          ) : data.subscription.status === "active" && data.subscription.endDate ? (
            <p className="text-sm">
              Your plan will renew on <b>{dayjs.unix(data.subscription.endDate).format("DD/MM/YYYY")}</b>
            </p>
          ) : data.subscription.status === "past_due" || data.subscription.status === "unpaid" ? (
            <p className="text-sm">Your plan requires payment</p>
          ) : null}
        </div>
      ) : (
        <div className="stack">
          <p className="text-lg">
            You are currently on the <b>Personal</b> plan
          </p>
          <p className="text-sm">Current usage</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm">Tasks</p>
              <p className="text-2xl">
                <span
                  className={join(
                    (data?.taskCount || 0) >= MAX_FREE_TASKS
                      ? "text-red-500"
                      : (data?.taskCount || 0) > MAX_FREE_TASKS * 0.75
                        ? "text-primary-500"
                        : undefined,
                  )}
                >
                  {data?.taskCount}{" "}
                </span>
                <span className="text-xs font-thin opacity-70">/ {MAX_FREE_TASKS}</span>
              </p>
            </div>
            <div>
              <p className="text-sm">Elements</p>
              <p className="text-2xl">
                <span
                  className={join(
                    (data?.elementCount || 0) >= MAX_FREE_ELEMENTS
                      ? "text-red-500"
                      : (data?.elementCount || 0) > MAX_FREE_ELEMENTS * 0.75
                        ? "text-primary-500"
                        : undefined,
                  )}
                >
                  {data?.elementCount}
                </span>{" "}
                <span className="text-xs font-thin opacity-70">/ 5</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <hr />

      <div className="w-full border-b border-r border-gray-100 text-xs dark:border-gray-600 md:text-sm">
        <div className="flex">
          <div className="flex flex-[3] border-l border-transparent p-1 md:p-2" />
          <div className="flex flex-[2] border-l border-t border-gray-100 p-1 dark:border-gray-600 md:p-2">
            <div className="stack space-y-0 md:space-y-2">
              <p className="text-md font-bold">Personal</p>
              <p className="text-xl font-medium">€0</p>
              <AlertDialog
                title="Cancel plan"
                description={`Are you sure? You will remain on the Pro plan until ${dayjs
                  .unix(data?.subscription?.endDate || 0)
                  .format("DD/MM/YYYY")}`}
                triggerButton={
                  <Button
                    size="xs"
                    isLoading={cancelFetcher.state !== "idle"}
                    colorScheme={!data?.subscription || data?.subscription?.isCancelled ? "gray" : "primary"}
                    disabled={!data?.subscription || data?.subscription?.isCancelled}
                  >
                    {data?.subscription ? "Downgrade" : "Current plan"}
                  </Button>
                }
                confirmButton={
                  <cancelFetcher.Form method="post">
                    <Button name="_action" value={ProfilePlanMethods.CancelPlan} colorScheme="red" type="submit">
                      Downgrade
                    </Button>
                  </cancelFetcher.Form>
                }
              />
            </div>
          </div>
          <div className="flex flex-[2] border-l border-t border-gray-100 p-1 dark:border-gray-600 md:p-2">
            <div className="stack space-y-0 md:space-y-2">
              <p className="text-md font-bold">Pro</p>
              <p className="whitespace-nowrap text-xl font-medium">
                €4 <span className="whitespace-nowrap text-xs font-thin opacity-70">per month</span>
              </p>

              {!data?.subscription ? (
                <Button size="xs" onClick={joinPlanProps.onOpen} colorScheme="primary">
                  Upgrade
                </Button>
              ) : data.subscription.isCancelled ? (
                <Form method="post" replace>
                  <FormButton name="_action" value={ProfilePlanMethods.ReactivatePlan} size="xs" colorScheme="primary">
                    Reactivate
                  </FormButton>
                </Form>
              ) : (
                <Button size="xs" disabled>
                  Current plan
                </Button>
              )}
              <Modal size="sm" title="Join Pro" {...joinPlanProps}>
                <Form replace method="post">
                  <div className="stack p-4">
                    <Input name="promoCode" placeholder="Have a promo code?" />
                    <ButtonGroup>
                      <Button onClick={joinPlanProps.onClose}>Cancel</Button>
                      <FormButton name="_action" value={ProfilePlanMethods.JoinPlan}>
                        Join
                      </FormButton>
                    </ButtonGroup>
                  </div>
                </Form>
              </Modal>
            </div>
          </div>
        </div>
        <div className="border-l border-t border-gray-100 dark:border-gray-600">
          <div className="flex border-b border-gray-100 dark:border-gray-600">
            <div className="flex flex-[3] p-1 font-semibold md:p-2">Usage</div>
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2" />
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2" />
          </div>
          <div className="flex border-b border-gray-100 dark:border-gray-600">
            <div className="flex flex-[3]  border-gray-100 p-1 opacity-70 dark:border-gray-600 md:p-2">Tasks</div>
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2 ">{MAX_FREE_TASKS}</div>
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">Unlimited</div>
          </div>
          <div className="flex border-b border-gray-100 dark:border-gray-600">
            <div className="flex flex-[3]  border-gray-100 p-1 opacity-70 dark:border-gray-600 md:p-2">Elements</div>
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">{MAX_FREE_ELEMENTS}</div>
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">Unlimited</div>
          </div>
          <div className="flex border-b border-gray-100 dark:border-gray-600">
            <div className="flex flex-[3] p-1 font-semibold md:p-2">Features</div>
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2" />
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2" />
          </div>
          <div className="flex border-b border-gray-100 dark:border-gray-600">
            <div className="flex flex-[3] p-1 opacity-70 md:p-2">Weather forecast</div>
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">✓</div>
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">✓</div>
          </div>
          <div className="flex">
            <div className="flex flex-[3] p-1 opacity-70 md:p-2">Habit tracking</div>
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2"></div>
            <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">✓</div>
          </div>
        </div>
      </div>
    </div>
  )
}
