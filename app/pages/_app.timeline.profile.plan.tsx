import * as React from "react"
import { ButtonGroup } from "@chakra-ui/react"
import * as c from "@chakra-ui/react"
import { Outlet, useFetcher, useLoaderData } from "@remix-run/react"
import type { ActionArgs, LoaderArgs, SerializeFrom } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import { redirect } from "@remix-run/server-runtime"
import dayjs from "dayjs"

import { FormButton } from "~/components/Form"
import { Modal } from "~/components/Modal"
import { FlashType, PRICE_ID } from "~/lib/config.server"
import { FULL_WEB_URL } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { useLoaderHeaders } from "~/lib/headers"
import { badRequest } from "~/lib/remix"
import { stripe } from "~/lib/stripe/stripe.server"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

export const headers = useLoaderHeaders
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
  const filteredSubscription = subscription
    ? {
        id: subscription.id,
        discountPercent: subscription.discount?.coupon.percent_off,
        isCancelled: subscription.cancel_at_period_end,
        endDate: subscription.current_period_end || 0,
        status: subscription.status,
      }
    : null
  return json(
    { taskCount, elementCount, subscription: filteredSubscription },
    { headers: { "Cache-Control": "max-age=60, s-maxage=360" } },
  )
}

export type ProfilePlan = SerializeFrom<typeof loader>

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
          success_url: FULL_WEB_URL + "/timeline/subscribed",
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
        return redirect("/timeline/profile/plan")
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error cancelling subscription") },
        })
      }
    case ProfilePlanMethods.ReactivatePlan:
      try {
        if (!user.stripeSubscriptionId) return badRequest("No subscription")
        await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: false })
        return redirect("/timeline/profile/plan")
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

export default function Plan() {
  const data = useLoaderData<typeof loader>()
  const joinPlanProps = c.useDisclosure()

  const cancelPlanProps = c.useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)

  const joinPlanFetcher = useFetcher()
  React.useEffect(() => {
    if (joinPlanFetcher.type === "actionReload") {
      joinPlanProps.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinPlanFetcher.type])

  const cancelFetcher = useFetcher()
  React.useEffect(() => {
    if (cancelFetcher.type === "actionReload") {
      cancelPlanProps.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelFetcher.type])

  const reactivateFetcher = useFetcher()

  const borderColor = c.useColorModeValue("gray.100", "gray.600")

  const discountedPlanAmount = data?.subscription?.discountPercent
    ? 4 - (4 * 100) / data.subscription.discountPercent
    : null

  return (
    <c.Stack spacing={4}>
      <c.Text fontSize="lg" fontWeight={500}>
        Plan
      </c.Text>
      <Outlet />
      {data?.subscription ? (
        <c.Stack>
          <c.Text fontSize="lg">
            You are currently on the <b>Pro</b> plan
          </c.Text>
          {discountedPlanAmount || discountedPlanAmount === 0 ? (
            <c.Text fontSize="sm">
              A {data?.subscription.discountPercent}% discount is applied to your subscription, you pay €
              {discountedPlanAmount} per month
            </c.Text>
          ) : null}
          {data.subscription.isCancelled ? (
            <c.Text fontSize="sm">
              You have cancelled but still have access to Pro features until{" "}
              <b>{dayjs.unix(data.subscription.endDate).format("DD/MM/YYYY")}</b>
            </c.Text>
          ) : data.subscription.status === "active" && data.subscription.endDate ? (
            <c.Text fontSize="sm">
              Your plan will renew on <b>{dayjs.unix(data.subscription.endDate).format("DD/MM/YYYY")}</b>
            </c.Text>
          ) : data.subscription.status === "past_due" || data.subscription.status === "unpaid" ? (
            <c.Text fontSize="sm">Your plan requires payment</c.Text>
          ) : null}
        </c.Stack>
      ) : (
        <c.Stack>
          <c.Text fontSize="lg">
            You are currently on the <b>Personal</b> plan
          </c.Text>
          <c.Text fontSize="sm">Current usage</c.Text>
          <c.Flex>
            <c.Stat>
              <c.StatLabel>Tasks</c.StatLabel>
              <c.StatNumber>
                <c.Text
                  as="span"
                  color={
                    (data?.taskCount || 0) >= 1000
                      ? "red.500"
                      : (data?.taskCount || 0) > 900
                      ? "primary.500"
                      : undefined
                  }
                >
                  {data?.taskCount}{" "}
                </c.Text>
                <c.Text as="span" fontWeight="thin" opacity={0.7} fontSize="xs">
                  / 1000
                </c.Text>
              </c.StatNumber>
            </c.Stat>
            <c.Stat>
              <c.StatLabel>Elements</c.StatLabel>
              <c.StatNumber>
                <c.Text
                  as="span"
                  color={
                    (data?.elementCount || 0) >= 5
                      ? "red.500"
                      : (data?.elementCount || 0) > 4
                      ? "primary.500"
                      : undefined
                  }
                >
                  {data?.elementCount}
                </c.Text>{" "}
                <c.Text as="span" fontWeight="thin" opacity={0.7} fontSize="xs">
                  / 5
                </c.Text>
              </c.StatNumber>
            </c.Stat>
          </c.Flex>
        </c.Stack>
      )}

      <c.Divider />

      <c.Box
        w="100%"
        fontSize={{ base: "xs", md: "sm" }}
        borderRight="1px solid"
        borderBottom="1px solid"
        borderColor={borderColor}
      >
        <c.Flex>
          <c.Flex flex={3} p={{ base: 1, md: 2 }} borderLeft="1px solid" borderColor="transparent" />
          <c.Flex
            flex={2}
            p={{ base: 1, md: 2 }}
            borderLeft="1px solid"
            borderTop="1px solid"
            borderColor={borderColor}
          >
            <c.Stack spacing={{ base: 0, md: 2 }}>
              <c.Text fontWeight="bold" fontSize="md">
                Personal
              </c.Text>
              <c.Text fontWeight="medium" fontSize="xl">
                €0
              </c.Text>
              <c.Button
                size={{ base: "xs", md: "sm" }}
                onClick={cancelPlanProps.onOpen}
                colorScheme={!data?.subscription || data?.subscription?.isCancelled ? "gray" : "primary"}
                isDisabled={!data?.subscription || data?.subscription?.isCancelled}
              >
                {data?.subscription ? "Downgrade" : "Current plan"}
              </c.Button>
              <c.AlertDialog
                {...cancelPlanProps}
                motionPreset="slideInBottom"
                leastDestructiveRef={cancelRef}
              >
                <c.AlertDialogOverlay>
                  <c.AlertDialogContent>
                    <c.AlertDialogHeader fontSize="lg" fontWeight="bold">
                      Cancel plan
                    </c.AlertDialogHeader>
                    <c.AlertDialogBody>
                      Are you sure? You will remain on the Pro plan until{" "}
                      {dayjs.unix(data?.subscription?.endDate || 0).format("DD/MM/YYYY")}
                    </c.AlertDialogBody>
                    <c.AlertDialogFooter>
                      <c.Button ref={cancelRef} onClick={cancelPlanProps.onClose}>
                        Cancel
                      </c.Button>

                      <c.Button
                        colorScheme="red"
                        type="submit"
                        ml={3}
                        isDisabled={cancelFetcher.state !== "idle"}
                        isLoading={cancelFetcher.state !== "idle"}
                        onClick={() => {
                          cancelFetcher.submit(
                            { _action: ProfilePlanMethods.CancelPlan },
                            { method: "post", action: `/api/profile/plan` },
                          )
                        }}
                      >
                        Downgrade
                      </c.Button>
                    </c.AlertDialogFooter>
                  </c.AlertDialogContent>
                </c.AlertDialogOverlay>
              </c.AlertDialog>
            </c.Stack>
          </c.Flex>
          <c.Flex
            flex={2}
            p={{ base: 1, md: 2 }}
            borderLeft="1px solid"
            borderTop="1px solid"
            borderColor={borderColor}
          >
            <c.Stack spacing={{ base: 0, md: 2 }}>
              <c.Text fontWeight="bold" fontSize="md">
                Pro
              </c.Text>
              <c.Text fontWeight="medium" fontSize="xl" whiteSpace="nowrap">
                €4{" "}
                <c.Text as="span" whiteSpace="nowrap" fontWeight="thin" opacity={0.7} fontSize="xs">
                  per month
                </c.Text>
              </c.Text>

              {!data?.subscription ? (
                <c.Button
                  size={{ base: "xs", md: "sm" }}
                  onClick={joinPlanProps.onOpen}
                  colorScheme="primary"
                >
                  Upgrade
                </c.Button>
              ) : data.subscription.isCancelled ? (
                <c.Button
                  size={{ base: "xs", md: "sm" }}
                  onClick={() =>
                    reactivateFetcher.submit(
                      { _action: ProfilePlanMethods.ReactivatePlan },
                      { method: "post", action: `/api/profile/plan` },
                    )
                  }
                  colorScheme="primary"
                  isLoading={reactivateFetcher.state !== "idle"}
                  isDisabled={reactivateFetcher.state !== "idle"}
                >
                  Reactivate
                </c.Button>
              ) : (
                <c.Button size={{ base: "xs", md: "sm" }} isDisabled={true}>
                  Current plan
                </c.Button>
              )}
              <Modal title="Join Pro" {...joinPlanProps}>
                <joinPlanFetcher.Form action="/api/profile/plan" replace method="post">
                  <c.Stack>
                    <c.Input name="promoCode" placeholder="Have a promo code?" />
                    <ButtonGroup>
                      <c.Button onClick={joinPlanProps.onClose}>Cancel</c.Button>
                      <FormButton name="_action" value={ProfilePlanMethods.JoinPlan}>
                        Join
                      </FormButton>
                    </ButtonGroup>
                  </c.Stack>
                </joinPlanFetcher.Form>
              </Modal>
            </c.Stack>
          </c.Flex>
        </c.Flex>
        <c.Flex
          borderBottom="1px solid"
          borderLeft="1px solid"
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <c.Flex p={{ base: 1, md: 2 }} flex={3} fontWeight="semibold">
            Usage
          </c.Flex>
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor} />
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor} />
        </c.Flex>
        <c.Flex borderBottom="1px solid" borderColor={borderColor}>
          <c.Flex
            p={{ base: 1, md: 2 }}
            flex={3}
            opacity={0.7}
            borderLeft="1px solid"
            borderColor={borderColor}
          >
            Tasks
          </c.Flex>
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            1000
          </c.Flex>
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            Unlimited
          </c.Flex>
        </c.Flex>
        <c.Flex borderBottom="1px solid" borderColor={borderColor}>
          <c.Flex
            p={{ base: 1, md: 2 }}
            flex={3}
            opacity={0.7}
            borderLeft="1px solid"
            borderColor={borderColor}
          >
            Elements
          </c.Flex>
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            5
          </c.Flex>
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            Unlimited
          </c.Flex>
        </c.Flex>
        <c.Flex borderBottom="1px solid" borderLeft="1px solid" borderColor={borderColor}>
          <c.Flex p={{ base: 1, md: 2 }} flex={3} fontWeight="semibold">
            Features
          </c.Flex>
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor} />
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor} />
        </c.Flex>
        <c.Flex borderBottom="1px solid" borderLeft="1px solid" borderColor={borderColor}>
          <c.Flex p={{ base: 1, md: 2 }} flex={3} opacity={0.7}>
            Weather forecast
          </c.Flex>
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            ✓
          </c.Flex>
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            ✓
          </c.Flex>
        </c.Flex>
        <c.Flex borderLeft="1px solid" borderColor={borderColor}>
          <c.Flex p={{ base: 1, md: 2 }} flex={3} opacity={0.7}>
            Habit tracking
          </c.Flex>
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor}></c.Flex>
          <c.Flex p={{ base: 1, md: 2 }} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            ✓
          </c.Flex>
        </c.Flex>
      </c.Box>
    </c.Stack>
  )
}
