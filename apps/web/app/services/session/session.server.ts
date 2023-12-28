import { env,IS_PRODUCTION } from "@element/server-env"
import { createCookieSessionStorage } from "@remix-run/node"

export const COOKIE_KEY = IS_PRODUCTION ? "element_session" : "element_session_dev"

const userStorage = createCookieSessionStorage({
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

export async function getUserSession(request: Request) {
  const session = await userStorage.getSession(request.headers.get("Cookie"))
  const commit = () => userStorage.commitSession(session)
  const destroy = () => userStorage.destroySession(session)
  const userId: string | null = session.get("userId") || null
  const setUser = (id: string) => {
    session.set("userId", id)
    return commit()
  }
  return { commit, destroy, session, setUser, userId }
}
