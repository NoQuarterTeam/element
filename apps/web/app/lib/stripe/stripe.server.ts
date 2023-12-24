import { env } from "@element/server-env"
import Stripe from "stripe"

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" })
