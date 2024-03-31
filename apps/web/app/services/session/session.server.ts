import { IS_PRODUCTION, env } from "@element/server-env"
import { createCookieSessionStorage } from "@remix-run/node"
import { createTypedSessionStorage } from "remix-utils/typed-session"
import { z } from "zod"

const COOKIE_KEY = IS_PRODUCTION ? "element" : "element_session_dev"

const storage = createCookieSessionStorage({
  cookie: {
    name: COOKIE_KEY,
    secrets: [env.SESSION_SECRET],
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

const userStorage = createTypedSessionStorage({ sessionStorage: storage, schema: z.object({ userId: z.string().optional() }) })

export async function getUserSession(request: Request) {
  const session = await userStorage.getSession(request.headers.get("Cookie"))
  const commit = () => userStorage.commitSession(session)
  const destroy = () => userStorage.destroySession(session)
  const setUser = (id: string) => {
    session.set("userId", id)
    return commit()
  }
  const userId = session.get("userId") || null
  return { commit, destroy, session, setUser, userId }
}
