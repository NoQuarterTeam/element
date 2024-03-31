import type { Stripe } from "@element/server-services"

export const INVOICE_STATUS: { [key in Stripe.Invoice.Status]: string } = {
  paid: "Paid",
  open: "Open",
  uncollectible: "Uncollectible",
  void: "Void",
  draft: "Draft",
}
