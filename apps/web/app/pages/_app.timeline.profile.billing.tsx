import { stripe } from "@element/server-services"
import type { ActionFunctionArgs, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import currencyjs from "currency.js"
import dayjs from "dayjs"
import { cacheHeader } from "pretty-cache-header"
import type Stripe from "stripe"
import { z } from "zod"

import { Badge } from "~/components/ui/Badge"
import { ButtonGroup } from "~/components/ui/ButtonGroup"
import { Form, FormButton, FormField, FormFieldLabel } from "~/components/ui/Form"
import { Select } from "~/components/ui/Inputs"
import { FORM_ACTION } from "~/lib/form"
import { formError, validateFormData } from "~/lib/form.server"
import { badRequest, json } from "~/lib/remix"
import { COUNTRIES } from "~/lib/static/countries"
import { INVOICE_STATUS } from "~/lib/static/invoiceStatus"
import { TAX_TYPES } from "~/lib/static/taxTypes"
import { getCurrentUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)
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
  return json({ billing, invoices: invoices.data }, request, {
    headers: { "Cache-Control": cacheHeader({ private: true, maxAge: "5mins", staleWhileRevalidate: "10seconds" }) },
  })
}
export type ProfileBilling = SerializeFrom<typeof loader>

export enum ProfileBillingMethods {
  UpdateBilling = "updateBilling",
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const action = formData.get(FORM_ACTION) as ProfileBillingMethods | undefined
  switch (action) {
    case ProfileBillingMethods.UpdateBilling:
      try {
        const schema = z.object({
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
        const result = await validateFormData(request, schema)
        if (!result.success) return formError(result)
        const data = result.data
        const customer = await stripe.customers.retrieve(user.stripeCustomerId, { expand: ["tax_ids"] })
        if (customer.deleted) return badRequest("No stripe customer")
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

        return json({ success: true }, request, { flash: { title: "Billing details updated" } })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        }
        return badRequest("Something went wrong")
      }

    default:
      return badRequest("Invalid action")
  }
}

export default function Billing() {
  const data = useLoaderData<typeof loader>()

  const billing = data?.billing
  const invoices = data?.invoices || []
  return (
    <div className="space-y-2">
      <p className="text-lg font-medium">Billing</p>
      <Form replace method="post">
        <div className="space-y-2">
          <p className="w-full text-sm font-semibold">Details</p>
          <FormField label="Billing name" defaultValue={billing?.name || ""} name="name" />
          <FormField label="Billing email" defaultValue={billing?.email || ""} name="email" />
          <div className="flex-wrap justify-between md:flex-nowrap">
            <FormFieldLabel htmlFor="address1">Billing address</FormFieldLabel>
            <div className="space-y-1">
              <FormField placeholder="Address 1" defaultValue={billing?.address?.line1 || ""} name="address1" />
              <FormField placeholder="Address 2" defaultValue={billing?.address?.line2 || ""} name="address2" />
              <div className="flex items-start space-x-2">
                <FormField placeholder="City" defaultValue={billing?.address?.city || ""} name="city" />
                <FormField placeholder="State/Province" defaultValue={billing?.address?.state || ""} name="state" />
              </div>
              <div className="flex items-start space-x-2">
                <FormField
                  placeholder="Country"
                  defaultValue={billing?.address?.country || ""}
                  name="country"
                  input={
                    <Select>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </Select>
                  }
                />
                <FormField placeholder="Post code/Zip code" defaultValue={billing?.address?.postal_code || ""} name="postCode" />
              </div>
            </div>
          </div>
          <div className="flex-wrap justify-between md:flex-nowrap">
            <p className="w-full pt-1 text-sm">Tax ID</p>
            <div className="flex items-start space-x-2">
              <FormField
                name="taxType"
                placeholder="Tax type"
                defaultValue={billing?.taxId.type || ""}
                input={
                  <Select>
                    {TAX_TYPES.map(({ type, name }) => (
                      <option key={type} value={type}>
                        {name}
                      </option>
                    ))}
                  </Select>
                }
              />
              <FormField placeholder="Tax ID" defaultValue={billing?.taxId.value || ""} name="taxId" />
            </div>
          </div>
          <ButtonGroup>
            <FormButton name="_action" value={ProfileBillingMethods.UpdateBilling}>
              Save
            </FormButton>
          </ButtonGroup>
        </div>
      </Form>
      <hr />
      <p className="w-full text-sm font-semibold">Invoices</p>
      <div className="space-y-2">
        {invoices.length === 0 ? (
          <div className="flex h-24 items-center justify-center">
            <p className="text-center">No invoices yet</p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.id} className="flex justify-between pt-1">
              <p className="text-sm">{dayjs.unix(invoice.created).format("MMM DD, YYYY")}</p>
              <div className="flex items-center space-x-2">
                <p className="text-right text-sm">
                  <Badge colorScheme={invoice.status === "open" ? "orange" : "gray"}>
                    {INVOICE_STATUS[invoice.status || "draft"]}
                  </Badge>
                </p>
                <p className="text-right text-sm">€{currencyjs(invoice.total, { fromCents: true }).value}</p>
                <a className="text-right text-sm opacity-70 hover:opacity-50" href={invoice.invoice_pdf || ""} download={true}>
                  Download
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
