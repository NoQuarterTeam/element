import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import type Stripe from "stripe"
import { z } from "zod"

import { FlashType } from "~/lib/config.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { stripe } from "~/lib/stripe/stripe.server"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

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
  return json({ billing, invoices: invoices.data })
}

export type ProfileBilling = UseDataFunctionReturn<typeof loader>

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
