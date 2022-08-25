import * as React from "react"
import { RiBankCard2Line, RiMap2Line, RiSettings2Line } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useFetcher, useSubmit } from "@remix-run/react"
import { useQuery } from "@tanstack/react-query"
import currencyjs from "currency.js"
import dayjs from "dayjs"
import Cookies from "js-cookie"

import { shallowEqual } from "~/lib/form"
import { transformImage } from "~/lib/helpers/image"
import { useProfileModalTab } from "~/lib/hooks/useProfileModalTab"
import { useToast } from "~/lib/hooks/useToast"
import { useUpdatesSeen } from "~/lib/hooks/useUpdatesSeen"
import { USER_LOCATION_COOKIE_KEY, useUserLocationEnabled } from "~/lib/hooks/useUserLocationEnabled"
import { COUNTRIES } from "~/lib/static/countries"
import { INVOICE_STATUS } from "~/lib/static/invoiceStatus"
import { TAX_TYPES } from "~/lib/static/taxTypes"
import { UPLOAD_PATHS } from "~/lib/uploadPaths"
import { useMe } from "~/pages/_timeline"
import { ProfileActionMethods } from "~/pages/api.profile"
import type { ProfileBilling } from "~/pages/api.profile.billing"
import { ProfileBillingMethods } from "~/pages/api.profile.billing"
import type { ProfilePlan } from "~/pages/api.profile.plan"
import { ProfilePlanMethods } from "~/pages/api.profile.plan"

import { ButtonGroup } from "./ButtonGroup"
import { FormButton, FormError, FormField, ImageField } from "./Form"
import { Modal } from "./Modal"

export function ProfileModal() {
  const me = useMe()
  const { tab, setTab } = useProfileModalTab()

  const { updatesSeens, setUpdatesSeens } = useUpdatesSeen()
  React.useEffect(() => {
    if (tab === "settings") {
      setUpdatesSeens(["weather"])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const bg = c.useColorModeValue("gray.50", "gray.800")
  const color = c.useColorModeValue("gray.400", "gray.500")

  return (
    <c.Flex minH={600} h="100%" overflow="hidden" borderRadius="md">
      <c.Box minW={140} w="min-content" h="auto" bg={bg}>
        <c.Text fontSize="0.7rem" px={4} w="min-content" color={color} py={2}>
          {me.email}
        </c.Text>
        <c.Stack spacing={0}>
          <c.Button
            justifyContent="flex-start"
            pl={4}
            variant={tab === "account" ? "solid" : "ghost"}
            fontWeight={400}
            fontSize="0.8rem"
            leftIcon={
              <c.Avatar
                src={me.avatar ? transformImage(me.avatar, "w_30,h_30,g_faces") : undefined}
                name={me.firstName + " " + me.lastName}
                size="xs"
                boxSize="15px"
              />
            }
            borderRadius={0}
            onClick={() => setTab("account")}
          >
            Account
          </c.Button>
          <c.Button
            justifyContent="flex-start"
            pl={4}
            variant={tab === "settings" ? "solid" : "ghost"}
            fontWeight={400}
            fontSize="0.8rem"
            leftIcon={
              <c.Box pos="relative">
                <c.Box as={RiSettings2Line} boxSize="15px" />
                {!updatesSeens.find((u) => ["weather"].includes(u)) && (
                  <c.Box
                    boxSize="5px"
                    borderRadius="full"
                    bg="red.500"
                    pos="absolute"
                    top="-3px"
                    right="-3px"
                  />
                )}
              </c.Box>
            }
            borderRadius={0}
            onClick={() => setTab("settings")}
          >
            Settings
          </c.Button>
          <c.Button
            justifyContent="flex-start"
            pl={4}
            variant={tab === "plan" ? "solid" : "ghost"}
            fontWeight={400}
            fontSize="0.8rem"
            leftIcon={<c.Box as={RiMap2Line} boxSize="15px" />}
            borderRadius={0}
            onClick={() => setTab("plan")}
          >
            Plan
          </c.Button>
          <c.Button
            justifyContent="flex-start"
            pl={4}
            variant={tab === "billing" ? "solid" : "ghost"}
            fontWeight={400}
            fontSize="0.8rem"
            leftIcon={<c.Box as={RiBankCard2Line} boxSize="15px" />}
            borderRadius={0}
            onClick={() => setTab("billing")}
          >
            Billing
          </c.Button>
        </c.Stack>
      </c.Box>
      <c.Box p={4} maxH={600} w="100%" overflowY="scroll">
        {tab === "account" ? (
          <Account />
        ) : tab === "settings" ? (
          <Settings />
        ) : tab === "plan" ? (
          <Plan />
        ) : tab === "billing" ? (
          <Billing />
        ) : null}
      </c.Box>
    </c.Flex>
  )
}

function Account() {
  const logoutSubmit = useSubmit()
  const me = useMe()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [isDirty, setIsDirty] = React.useState(false)
  const updateProfileFetcher = useFetcher()

  const alertProps = c.useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const destroyAccountFetcher = useFetcher()
  return (
    <c.Stack spacing={4} pb={6}>
      <c.Text fontSize="lg" fontWeight={500}>
        Account
      </c.Text>
      <updateProfileFetcher.Form
        ref={formRef}
        action="/api/profile"
        method="post"
        replace
        onChange={(e) => {
          const formData = new FormData(e.currentTarget)
          const data = Object.fromEntries(formData) as Record<string, string>
          const { firstName, lastName, email, avatar } = me
          const isDirty = !shallowEqual({ avatar, firstName, lastName, email }, data)
          setIsDirty(isDirty)
        }}
      >
        <c.Stack spacing={4}>
          <FormField
            defaultValue={me.email}
            name="email"
            label="Email"
            error={updateProfileFetcher.data?.fieldErrors?.email?.[0]}
          />
          <FormField
            defaultValue={me.firstName}
            name="firstName"
            label="First name"
            error={updateProfileFetcher.data?.fieldErrors?.firstName?.[0]}
          />
          <FormField
            defaultValue={me.lastName}
            name="lastName"
            label="Last name"
            error={updateProfileFetcher.data?.fieldErrors?.lastName?.[0]}
          />
          <ImageField
            height="100px"
            defaultValue={me.avatar}
            width="100px"
            error={updateProfileFetcher.data?.fieldErrors?.avatar?.[0]}
            label="Avatar"
            name="avatar"
            path={UPLOAD_PATHS.userAvatar(me.id)}
          />
          <FormError error={updateProfileFetcher.data?.formError} />
          <c.ButtonGroup>
            <c.Button
              type="submit"
              colorScheme="orange"
              isDisabled={!isDirty || updateProfileFetcher.state !== "idle"}
              isLoading={updateProfileFetcher.state !== "idle"}
              name="_action"
              value={ProfileActionMethods.UpdateProfile}
            >
              Save
            </c.Button>
            {isDirty && (
              <c.Button
                variant="ghost"
                onClick={() => {
                  formRef.current?.reset()
                  setIsDirty(false)
                }}
              >
                Cancel
              </c.Button>
            )}
          </c.ButtonGroup>
        </c.Stack>
      </updateProfileFetcher.Form>
      <c.Divider />
      <c.Box>
        <c.Button variant="outline" onClick={() => logoutSubmit(null, { method: "post", action: "/logout" })}>
          Log out
        </c.Button>
      </c.Box>
      <c.Divider />
      <c.Stack>
        <c.Text fontSize="sm">Danger zone</c.Text>
        <c.Text fontSize="xs">
          Permanently delete your account and all of its contents. This action is not reversible - please
          continue with caution.
        </c.Text>
        <c.Box>
          <c.Button colorScheme="red" onClick={alertProps.onOpen}>
            Delete account
          </c.Button>
        </c.Box>
      </c.Stack>

      <c.AlertDialog {...alertProps} motionPreset="slideInBottom" isCentered leastDestructiveRef={cancelRef}>
        <c.AlertDialogOverlay>
          <c.AlertDialogContent>
            <c.AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete account
            </c.AlertDialogHeader>
            <c.AlertDialogBody>Are you sure? You can't undo this action afterwards.</c.AlertDialogBody>
            <c.AlertDialogFooter>
              <c.Button ref={cancelRef} onClick={alertProps.onClose}>
                Cancel
              </c.Button>
              <destroyAccountFetcher.Form method="post" action="/api/profile" replace>
                <c.Button
                  colorScheme="red"
                  type="submit"
                  ml={3}
                  name="_action"
                  isLoading={destroyAccountFetcher.state !== "idle"}
                  isDisabled={destroyAccountFetcher.state !== "idle"}
                  value={ProfileActionMethods.DeleteAcccount}
                >
                  Delete
                </c.Button>
              </destroyAccountFetcher.Form>
            </c.AlertDialogFooter>
          </c.AlertDialogContent>
        </c.AlertDialogOverlay>
      </c.AlertDialog>
    </c.Stack>
  )
}

function Settings() {
  const userLocation = useUserLocationEnabled()
  const toast = useToast()

  const handleToggleWeather = () => {
    if (userLocation.isEnabled) {
      Cookies.remove(USER_LOCATION_COOKIE_KEY)
      userLocation.toggle()
    } else {
      function handleError(error: any) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
          case error.POSITION_UNAVAILABLE:
            return
          case error.TIMEOUT:
            return toast({ description: "The request to get user location timed out.", status: "error" })
          case error.UNKNOWN_ERROR:
            return toast({ description: "An unknown error occurred.", status: "error" })
        }
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
          const sleep = (delay = 200) => new Promise((res) => setTimeout(res, delay))
          Cookies.set(
            USER_LOCATION_COOKIE_KEY,
            JSON.stringify({ lat: coords.latitude, lon: coords.longitude }),
            { expires: 10000 },
          )
          await sleep()
          userLocation.toggle()
        }, handleError)
      } else {
        return toast({ description: "Geolocation is not supported by this browser.", status: "error" })
      }
    }
  }

  return (
    <c.Stack spacing={4} pb={6}>
      <c.Text fontSize="lg" fontWeight={500}>
        Settings
      </c.Text>

      <c.Stack spacing={4}>
        <c.Stack>
          <c.HStack>
            <c.Text fontSize="sm">Weather</c.Text>
            <c.Badge size="sm" colorScheme="orange">
              New
            </c.Badge>
          </c.HStack>
          <c.Text fontSize="xs">Show the next weeks weather based on your current location.</c.Text>
          <c.Switch onChange={handleToggleWeather} defaultChecked={userLocation.isEnabled} />
        </c.Stack>
      </c.Stack>
    </c.Stack>
  )
}

function Plan() {
  const { data, isLoading, refetch } = useQuery(
    ["profilePlan"],
    async () => {
      const response = await fetch(`/api/profile/plan`)
      if (!response.ok) throw new Error("Network response was not ok")
      return response.json() as Promise<ProfilePlan>
    },
    { staleTime: 1000, keepPreviousData: true },
  )

  const joinPlanProps = c.useDisclosure()

  const cancelPlanProps = c.useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)

  const joinPlanFetcher = useFetcher()
  React.useEffect(() => {
    if (joinPlanFetcher.type === "actionReload") {
      refetch()
      joinPlanProps.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinPlanFetcher.type])

  const cancelFetcher = useFetcher()
  React.useEffect(() => {
    if (cancelFetcher.type === "actionReload") {
      refetch()
      cancelPlanProps.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelFetcher.type])

  const reactivateFetcher = useFetcher()
  React.useEffect(() => {
    if (reactivateFetcher.type === "actionReload") {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactivateFetcher.type])

  const borderColor = c.useColorModeValue("gray.100", "gray.700")

  if (isLoading)
    return (
      <c.Center h="200px">
        <c.Spinner />
      </c.Center>
    )

  const discountedPlanAmount = data?.subscription?.discount?.coupon.percent_off
    ? 4 - (4 * 100) / data.subscription.discount.coupon.percent_off
    : null

  return (
    <c.Stack spacing={4} pb={6}>
      <c.Text fontSize="lg" fontWeight={500}>
        Plan
      </c.Text>
      {data?.subscription ? (
        <c.Stack>
          <c.Text fontSize="lg">
            You are currently on the <b>Pro</b> plan
          </c.Text>
          {discountedPlanAmount || discountedPlanAmount === 0 ? (
            <c.Text fontSize="sm">
              A {data?.subscription.discount?.coupon.percent_off}% discount is applied to your subscription,
              you pay €{discountedPlanAmount} per month
            </c.Text>
          ) : null}
          {data.subscription.cancel_at_period_end ? (
            <c.Text fontSize="sm">
              You have cancelled but still have access to Pro features until{" "}
              <b>{dayjs.unix(data.subscription.current_period_end).format("DD/MM/YYYY")}</b>
            </c.Text>
          ) : data.subscription.status === "active" && data.subscription.current_period_end ? (
            <c.Text fontSize="sm">
              Your plan will renew on{" "}
              <b>{dayjs.unix(data.subscription.current_period_end).format("DD/MM/YYYY")}</b>
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
                {data?.taskCount}{" "}
                <c.Text as="span" fontWeight="thin" opacity={0.7} fontSize="xs">
                  / 1000
                </c.Text>
              </c.StatNumber>
            </c.Stat>
            <c.Stat>
              <c.StatLabel>Elements</c.StatLabel>
              <c.StatNumber>
                {data?.elementCount}{" "}
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
        fontSize="sm"
        borderRight="1px solid"
        borderBottom="1px solid"
        borderColor={borderColor}
      >
        <c.Flex>
          <c.Flex flex={3} p={2} borderLeft="1px solid" borderColor="transparent" />
          <c.Flex flex={2} p={2} borderLeft="1px solid" borderTop="1px solid" borderColor={borderColor}>
            <c.Stack>
              <c.Text fontWeight="bold" fontSize="md">
                Personal
              </c.Text>
              <c.Text fontWeight="medium" fontSize="xl">
                €0
              </c.Text>
              <c.Button
                onClick={cancelPlanProps.onOpen}
                colorScheme={
                  !data?.subscription || data?.subscription?.cancel_at_period_end ? "gray" : "orange"
                }
                isDisabled={!data?.subscription || data?.subscription?.cancel_at_period_end}
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
                      {dayjs.unix(data?.subscription?.current_period_end || 0).format("DD/MM/YYYY")}
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
          <c.Flex flex={2} p={2} borderLeft="1px solid" borderTop="1px solid" borderColor={borderColor}>
            <c.Stack>
              <c.Text fontWeight="bold" fontSize="md">
                Pro
              </c.Text>
              <c.Text fontWeight="medium" fontSize="xl">
                €4{" "}
                <c.Text as="span" fontWeight="thin" opacity={0.7} fontSize="xs">
                  per month
                </c.Text>
              </c.Text>

              {!data?.subscription ? (
                <c.Button onClick={joinPlanProps.onOpen} colorScheme="orange">
                  Upgrade
                </c.Button>
              ) : data.subscription.cancel_at_period_end ? (
                <c.Button
                  onClick={() =>
                    reactivateFetcher.submit(
                      { _action: ProfilePlanMethods.ReactivatePlan },
                      { method: "post", action: `/api/profile/plan` },
                    )
                  }
                  colorScheme="orange"
                  isLoading={reactivateFetcher.state !== "idle"}
                  isDisabled={reactivateFetcher.state !== "idle"}
                >
                  Reactivate
                </c.Button>
              ) : (
                <c.Button isDisabled={true}>Current plan</c.Button>
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
          <c.Flex p={2} flex={3} fontWeight="semibold">
            Usage
          </c.Flex>
          <c.Flex p={2} flex={2} borderLeft="1px solid" borderColor={borderColor} />
          <c.Flex p={2} flex={2} borderLeft="1px solid" borderColor={borderColor} />
        </c.Flex>
        <c.Flex borderBottom="1px solid" borderColor={borderColor}>
          <c.Flex p={2} flex={3} opacity={0.7} borderLeft="1px solid" borderColor={borderColor}>
            Tasks
          </c.Flex>
          <c.Flex p={2} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            1000
          </c.Flex>
          <c.Flex p={2} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            Unlimited
          </c.Flex>
        </c.Flex>
        <c.Flex borderBottom="1px solid" borderColor={borderColor}>
          <c.Flex p={2} flex={3} opacity={0.7} borderLeft="1px solid" borderColor={borderColor}>
            Elements
          </c.Flex>
          <c.Flex p={2} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            5
          </c.Flex>
          <c.Flex p={2} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            Unlimited
          </c.Flex>
        </c.Flex>
        <c.Flex borderBottom="1px solid" borderLeft="1px solid" borderColor={borderColor}>
          <c.Flex p={2} flex={3} fontWeight="semibold">
            Features
          </c.Flex>
          <c.Flex p={2} flex={2} borderLeft="1px solid" borderColor={borderColor} />
          <c.Flex p={2} flex={2} borderLeft="1px solid" borderColor={borderColor} />
        </c.Flex>
        <c.Flex>
          <c.Flex p={2} flex={3} opacity={0.7} borderLeft="1px solid" borderColor={borderColor}>
            Weather forecast
          </c.Flex>
          <c.Flex p={2} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            ✓
          </c.Flex>
          <c.Flex p={2} flex={2} borderLeft="1px solid" borderColor={borderColor}>
            ✓
          </c.Flex>
        </c.Flex>
      </c.Box>
    </c.Stack>
  )
}

function Billing() {
  const { data, isLoading, refetch } = useQuery(
    ["profileBilling"],
    async () => {
      const response = await fetch(`/api/profile/billing`)
      if (!response.ok) throw new Error("Network response was not ok")
      return response.json() as Promise<ProfileBilling>
    },
    { staleTime: 1000, keepPreviousData: true },
  )

  const billingFetcher = useFetcher()

  React.useEffect(() => {
    if (billingFetcher.type === "actionReload") {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingFetcher.type])

  if (isLoading)
    return (
      <c.Center h="200px">
        <c.Spinner />
      </c.Center>
    )
  const billing = data?.billing
  const invoices = data?.invoices
  return (
    <c.Stack spacing={4} pb={6}>
      <c.Text fontSize="lg" fontWeight={500}>
        Billing
      </c.Text>
      <billingFetcher.Form action="/api/profile/billing" replace method="post">
        <c.Stack>
          <c.Text w="100%" fontSize="sm" fontWeight="semibold">
            Details
          </c.Text>
          <c.Flex justify="space-between">
            <c.Text pt={1} w="100%" fontSize="sm">
              Billing name
            </c.Text>
            <c.Box>
              <FormField
                error={billingFetcher.data?.fieldErrors?.name?.[0]}
                defaultValue={billing?.name || ""}
                name="name"
              />
            </c.Box>
          </c.Flex>
          <c.Flex justify="space-between">
            <c.Text pt={1} w="100%" fontSize="sm">
              Billing email
            </c.Text>
            <c.Box>
              <FormField
                error={billingFetcher.data?.fieldErrors?.email?.[0]}
                defaultValue={billing?.email || ""}
                name="email"
              />
            </c.Box>
          </c.Flex>
          <c.Flex align="flex-start" justify="space-between">
            <c.Text pt={1} w="100%" fontSize="sm">
              Billing address
            </c.Text>
            <c.Stack spacing={1}>
              <FormField
                placeholder="Address 1"
                error={billingFetcher.data?.fieldErrors?.line1?.[0]}
                defaultValue={billing?.address?.line1 || ""}
                name="address1"
              />
              <FormField
                placeholder="Address 2"
                error={billingFetcher.data?.fieldErrors?.line2?.[0]}
                defaultValue={billing?.address?.line2 || ""}
                name="address2"
              />
              <c.HStack align="flex-start">
                <FormField
                  placeholder="City"
                  error={billingFetcher.data?.fieldErrors?.city?.[0]}
                  defaultValue={billing?.address?.city || ""}
                  name="city"
                />
                <FormField
                  placeholder="State/Province"
                  error={billingFetcher.data?.fieldErrors?.state?.[0]}
                  defaultValue={billing?.address?.state || ""}
                  name="state"
                />
              </c.HStack>
              <c.HStack align="flex-start">
                <FormField
                  placeholder="Country"
                  defaultValue={billing?.address?.country || ""}
                  name="country"
                  error={billingFetcher.data?.fieldErrors?.country?.[0]}
                  input={
                    <c.Select>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </c.Select>
                  }
                />
                <FormField
                  error={billingFetcher.data?.fieldErrors?.postCode?.[0]}
                  placeholder="Post code/Zip code"
                  defaultValue={billing?.address?.postal_code || ""}
                  name="postCode"
                />
              </c.HStack>
            </c.Stack>
          </c.Flex>
          <c.Flex align="flex-start" justify="space-between">
            <c.Text pt={1} w="100%" fontSize="sm">
              Tax ID
            </c.Text>
            <c.HStack align="flex-start">
              <FormField
                error={billingFetcher.data?.fieldErrors?.taxType?.[0]}
                name="taxType"
                placeholder="Tax type"
                defaultValue={billing?.taxId.type || ""}
                input={
                  <c.Select>
                    {TAX_TYPES.map(({ type, name }) => (
                      <option key={type} value={type}>
                        {name}
                      </option>
                    ))}
                  </c.Select>
                }
              />
              <FormField
                placeholder="Tax ID"
                error={billingFetcher.data?.fieldErrors?.taxId?.[0]}
                defaultValue={billing?.taxId.value || ""}
                name="taxId"
              />
            </c.HStack>
          </c.Flex>
          <ButtonGroup>
            <c.Button
              type="submit"
              colorScheme="orange"
              name="_action"
              isLoading={billingFetcher.state !== "idle"}
              isDisabled={billingFetcher.state !== "idle"}
              value={ProfileBillingMethods.UpdateBilling}
            >
              Save
            </c.Button>
          </ButtonGroup>
        </c.Stack>
      </billingFetcher.Form>
      <c.Divider />
      <c.Text w="100%" fontSize="sm" fontWeight="semibold">
        Invoices
      </c.Text>
      <c.Stack>
        {invoices?.map((invoice) => (
          <c.Flex key={invoice.id} pt={1} justify="space-between">
            <c.Text fontSize="sm">{dayjs.unix(invoice.created).format("MMM DD, YYYY")}</c.Text>
            <c.HStack spacing={4}>
              <c.Text textAlign="right" fontSize="sm">
                {INVOICE_STATUS[invoice.status || "draft"]}
              </c.Text>
              <c.Text textAlign="right" fontSize="sm">
                €{currencyjs(invoice.total, { fromCents: true }).value}
              </c.Text>
              <c.Link
                textAlign="right"
                opacity={0.7}
                fontSize="sm"
                href={invoice.invoice_pdf || ""}
                download={true}
              >
                Download
              </c.Link>
            </c.HStack>
          </c.Flex>
        ))}
      </c.Stack>
    </c.Stack>
  )
}
