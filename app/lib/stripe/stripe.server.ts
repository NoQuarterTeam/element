import Stripe from "stripe"

import { STRIPE_SECRET_KEY } from "../config.server"

export const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2022-08-01" })
