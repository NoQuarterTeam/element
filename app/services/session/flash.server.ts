import { createCookieSessionStorage } from "@remix-run/node"

import { IS_PRODUCTION } from "~/lib/config"
import { FLASH_SESSION_SECRET } from "~/lib/config.server"
import type { Await } from "~/lib/helpers/types"

export const FLASH_COOKIE_KEY = IS_PRODUCTION ? "element_session_flash" : "element_session_dev_flash"

export enum FlashType {
  Error = "flashError",
  Info = "flashInfo",
  Success = "flashSuccess",
}

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
