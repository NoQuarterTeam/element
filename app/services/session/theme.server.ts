import { createCookieSessionStorage } from "@remix-run/node"

import { IS_PRODUCTION } from "~/lib/config"
import { THEME_SESSION_SECRET } from "~/lib/config.server"
import { type Theme, isTheme } from "~/lib/theme"

export const THEME_COOKIE_KEY = IS_PRODUCTION ? "element_session_theme" : "element_session_dev_theme"

const themeStorage = createCookieSessionStorage({
  cookie: {
    name: THEME_COOKIE_KEY,
    secure: true,
    secrets: [THEME_SESSION_SECRET],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  },
})

export async function getThemeSession(request: Request) {
  const session = await themeStorage.getSession(request.headers.get("Cookie"))
  return {
    getTheme: () => {
      const themeValue = session.get("theme")
      return isTheme(themeValue) ? themeValue : "light"
    },
    setTheme: (theme: Theme) => session.set("theme", theme),
    commit: () => themeStorage.commitSession(session),
  }
}
