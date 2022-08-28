import * as c from "@chakra-ui/react"
import { useLoaderData } from "@remix-run/react"
import type { ActionArgs, LoaderArgs, SerializeFrom } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import currencyjs from "currency.js"
import dayjs from "dayjs"
import type Stripe from "stripe"
import { z } from "zod"

import { ButtonGroup } from "~/components/ButtonGroup"
import { Form, FormButton, FormField } from "~/components/Form"
import { FlashType } from "~/lib/config.server"
import { validateFormData } from "~/lib/form"
import { useLoaderHeaders } from "~/lib/headers"
import { badRequest } from "~/lib/remix"
import { COUNTRIES } from "~/lib/static/countries"
import { INVOICE_STATUS } from "~/lib/static/invoiceStatus"
import { TAX_TYPES } from "~/lib/static/taxTypes"
import { stripe } from "~/lib/stripe/stripe.server"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

export const headers = useLoaderHeaders
export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const [stripeCustomer, invoices] = await Promise.all([
    stripe.customers.retrieve(user.stripeCustomerId, { expand: ["tax_ids"] }),
    stripe.invoices.list({ customer: user.stripeCustomerId }),
  ])
  if (stripeCustomer.deleted) throw badRequest("stripe customer deleted")
  const billing = {
    address: stripeCustomer.address,
    name: stripeCustomer.name,
    email: stripeCustomer.email,
    taxId: { value: stripeCustomer.tax_ids?.data?.[0]?.value, type: stripeCustomer.tax_ids?.data?.[0]?.type },
  }
  return json(
    { billing, invoices: invoices.data },
    { headers: { "Cache-Control": "max-age=60, s-maxage=360" } },
  )
}
export type ProfileBilling = SerializeFrom<typeof loader>

export enum ProfileBillingMethods {
  UpdateBilling = "updateBilling",
}

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request)
  const { createFlash } = await getFlashSession(request)
  const formData = await request.formData()
  const action = formData.get("_action") as ProfileBillingMethods | undefined
  switch (action) {
    case ProfileBillingMethods.UpdateBilling:
      try {
        const billingSchema = z.object({
          email: z.string().min(3).email("Invalid email"),
          name: z.string().min(2, "Must be at least 2 characters"),
          address1: z.string().nullable().optional(),
          address2: z.string().nullable().optional(),
          city: z.string().nullable().optional(),
          state: z.string().nullable().optional(),
          postCode: z.string().nullable().optional(),
          country: z.string().nullable().optional(),
          taxId: z.string().nullable().optional(),
          taxType: z.string().nullable().optional(),
        })
        const { data, fieldErrors } = await validateFormData(billingSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        const customer = await stripe.customers.retrieve(user.stripeCustomerId, { expand: ["tax_ids"] })
        if (customer.deleted)
          return badRequest("No stripe customer", {
            headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error updating billing details") },
          })
        const oldTaxId = customer.tax_ids?.data[0]?.id
        const oldTaxValue = customer?.tax_ids?.data?.[0]?.value
        const oldTaxType = customer?.tax_ids?.data?.[0]?.type
        if (data.taxId && !data.taxType) {
          return badRequest({ fieldErrors: { taxType: ["Tax ID required"] }, data })
        }
        if (!data.taxId && oldTaxId) {
          await stripe.customers.deleteTaxId(customer.id, oldTaxId)
        }
        if (data.taxId && data.taxType && (oldTaxValue !== data.taxId || oldTaxType !== data.taxType)) {
          try {
            if (oldTaxId) await stripe.customers.deleteTaxId(customer.id, oldTaxId)
            await stripe.customers.createTaxId(user.stripeCustomerId, {
              type: data.taxType as Stripe.TaxIdCreateParams["type"],
              value: data.taxId,
            })
          } catch {
            return badRequest({ fieldErrors: { taxId: ["Invalid tax ID"] }, data })
          }
        }
        await stripe.customers.update(user.stripeCustomerId, {
          email: data.email,
          name: data.name,
          address: {
            line1: data.address1 || "",
            line2: data.address2 || "",
            city: data.city || "",
            state: data.state || "",
            postal_code: data.postCode || "",
            country: data.country || "",
          },
        })

        return json(
          { success: true },
          { headers: { "Set-Cookie": await createFlash(FlashType.Success, "Billing details updated") } },
        )
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error updating billing details") },
        })
      }

    default:
      return badRequest("Invalid action", {
        headers: { "Set-Cookie": await createFlash(FlashType.Error, "Invalid action") },
      })
  }
}

export default function Billing() {
  const data = useLoaderData<typeof loader>()

  const billing = data?.billing
  const invoices = data?.invoices || []
  return (
    <c.Stack spacing={4}>
      <c.Text fontSize="lg" fontWeight={500}>
        Billing
      </c.Text>
      <Form replace method="post">
        <c.Stack>
          <c.Text w="100%" fontSize="sm" fontWeight="semibold">
            Details
          </c.Text>
          <c.Flex justify="space-between" flexWrap={{ base: "wrap", md: "nowrap" }}>
            <c.Text pt={1} w="100%" fontSize="sm">
              Billing name
            </c.Text>
            <c.Box>
              <FormField defaultValue={billing?.name || ""} name="name" />
            </c.Box>
          </c.Flex>
          <c.Flex justify="space-between" flexWrap={{ base: "wrap", md: "nowrap" }}>
            <c.Text pt={1} w="100%" fontSize="sm">
              Billing email
            </c.Text>
            <c.Box>
              <FormField defaultValue={billing?.email || ""} name="email" />
            </c.Box>
          </c.Flex>
          <c.Flex justify="space-between" flexWrap={{ base: "wrap", md: "nowrap" }}>
            <c.Text pt={1} w="100%" fontSize="sm">
              Billing address
            </c.Text>
            <c.Stack spacing={1}>
              <FormField
                placeholder="Address 1"
                defaultValue={billing?.address?.line1 || ""}
                name="address1"
              />
              <FormField
                placeholder="Address 2"
                defaultValue={billing?.address?.line2 || ""}
                name="address2"
              />
              <c.HStack align="flex-start">
                <FormField placeholder="City" defaultValue={billing?.address?.city || ""} name="city" />
                <FormField
                  placeholder="State/Province"
                  defaultValue={billing?.address?.state || ""}
                  name="state"
                />
              </c.HStack>
              <c.HStack align="flex-start">
                <FormField
                  placeholder="Country"
                  defaultValue={billing?.address?.country || ""}
                  name="country"
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
                  placeholder="Post code/Zip code"
                  defaultValue={billing?.address?.postal_code || ""}
                  name="postCode"
                />
              </c.HStack>
            </c.Stack>
          </c.Flex>
          <c.Flex justify="space-between" flexWrap={{ base: "wrap", md: "nowrap" }}>
            <c.Text pt={1} w="100%" fontSize="sm">
              Tax ID
            </c.Text>
            <c.HStack align="flex-start">
              <FormField
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
              <FormField placeholder="Tax ID" defaultValue={billing?.taxId.value || ""} name="taxId" />
            </c.HStack>
          </c.Flex>
          <ButtonGroup>
            <FormButton name="_action" value={ProfileBillingMethods.UpdateBilling}>
              Save
            </FormButton>
          </ButtonGroup>
        </c.Stack>
      </Form>
      <c.Divider />
      <c.Text w="100%" fontSize="sm" fontWeight="semibold">
        Invoices
      </c.Text>
      <c.Stack>
        {invoices.length === 0 ? (
          <c.Center h="100px">
            <c.Text textAlign="center">No invoices yet</c.Text>
          </c.Center>
        ) : (
          invoices.map((invoice) => (
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
          ))
        )}
      </c.Stack>
    </c.Stack>
  )
}
