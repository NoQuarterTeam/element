import type Stripe from "stripe"

export const INVOICE_STATUS: { [key in Stripe.Invoice.Status]: string } = {
  paid: "Paid",
  open: "Open",
  uncollectible: "Uncollectible",
  void: "Void",
  draft: "Draft",
  deleted: "Deleted",
}
