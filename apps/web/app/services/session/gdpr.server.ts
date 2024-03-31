import { createTypedSessionStorage } from "remix-utils/typed-session"
import { z } from "zod"

import { IS_PRODUCTION, env } from "@element/server-env"
import { createCookieSessionStorage } from "@remix-run/node"

const COOKIE_KEY = IS_PRODUCTION ? "ramble_session_gdpr" : "ramble_session_dev_gdpr"

const storage = createCookieSessionStorage({
  cookie: {
    name: COOKIE_KEY,
    secrets: [env.SESSION_SECRET],
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
    httpOnly: true,
  },
})
const config = z.object({ isAnalyticsEnabled: z.boolean() }).optional()

const schema = z.object({ config })
const gdprStorage = createTypedSessionStorage({
  sessionStorage: storage,
  schema,
})

export async function getGdprSession(request: Request) {
  const session = await gdprStorage.getSession(request.headers.get("Cookie"))
  const gdpr = session.get("config")

  return {
    gdpr,
    setGdpr: (status: z.infer<typeof schema>["config"]) => session.set("config", status),
    commit: () => gdprStorage.commitSession(session),
  }
}
