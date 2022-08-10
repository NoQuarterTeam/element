import { createCookieSessionStorage } from "@remix-run/node"

import { IS_PRODUCTION } from "~/lib/config"
import { FLASH_SESSION_SECRET, FlashType, SESSION_SECRET } from "~/lib/config.server"
import type { Await } from "~/lib/helpers/types"

export const COOKIE_KEY = IS_PRODUCTION ? "element_session" : "element_session_dev"

const userStorage = createCookieSessionStorage({
  cookie: {
    name: COOKIE_KEY,
    secure: IS_PRODUCTION,
    secrets: [SESSION_SECRET],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

export const FLASH_COOKIE_KEY = IS_PRODUCTION ? "element_session_flash" : "element_session_dev_flash"

const flashStorage = createCookieSessionStorage({
  cookie: {
    name: FLASH_COOKIE_KEY,
    secrets: [FLASH_SESSION_SECRET],
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
  let userId: string | null = session.get("userId") || null
  const setUser = (id: string) => {
    session.set("userId", id)
    return commit()
  }
  return { commit, destroy, session, setUser, userId }
}

export async function getFlashSession(request: Request) {
  const session = await flashStorage.getSession(request.headers.get("Cookie"))
  const flashError = session.get(FlashType.Error) || null
  const flashInfo = session.get(FlashType.Info) || null
  const flashSuccess = session.get(FlashType.Success) || null

  const commit = () => flashStorage.commitSession(session)
  const createFlash = (type: FlashType, message: string) => {
    session.flash(type, message)
    return commit()
  }
  return {
    flash: { flashError, flashInfo, flashSuccess },
    createFlash,
    commit,
    session,
  }
}

export type FlashSession = Await<typeof getFlashSession>
