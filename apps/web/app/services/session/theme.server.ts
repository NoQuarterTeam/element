import { IS_PRODUCTION, env } from "@element/server-env"
import { createCookieSessionStorage } from "@remix-run/node"
import { createTypedSessionStorage } from "remix-utils/typed-session"
import { z } from "zod"

import { type Theme, isTheme } from "~/lib/theme"

const THEME_COOKIE_KEY = IS_PRODUCTION ? "element_session_theme" : "element_session_dev_theme"

const storage = createCookieSessionStorage({
  cookie: {
    name: THEME_COOKIE_KEY,
    secrets: [env.THEME_SESSION_SECRET],
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

const themeStorage = createTypedSessionStorage({
  sessionStorage: storage,
  schema: z.object({ theme: z.enum(["light", "dark"]).optional() }),
})

export async function getThemeSession(request: Request) {
  const session = await themeStorage.getSession(request.headers.get("Cookie"))
  const themeValue = session.get("theme")
  const theme = isTheme(themeValue) ? themeValue : "light"
  return {
    theme,
    setTheme: (theme: Theme) => session.set("theme", theme),
    commit: () => themeStorage.commitSession(session),
  }
}
