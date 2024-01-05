import { Client } from "@upstash/qstash"
import { Receiver } from "@upstash/qstash"

import { env } from "@element/server-env"

export const qstash = new Client({ token: env.QSTASH_TOKEN })

export const qstashReceiver = new Receiver({
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
})
