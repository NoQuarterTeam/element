import { IS_PRODUCTION, env } from "@element/server-env"
import { createCookieSessionStorage } from "@remix-run/node"
import { createTypedSessionStorage } from "remix-utils/typed-session"
import { z } from "zod"

const FLASH_COOKIE_KEY = IS_PRODUCTION ? "element_session_flash" : "element_session_dev_flash"

export enum FlashType {
  Error = "flashError",
  Info = "flashInfo",
}

const storage = createCookieSessionStorage({
  cookie: {
    name: FLASH_COOKIE_KEY,
    secrets: [env.FLASH_SESSION_SECRET],
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  },
})
const flashType = z.enum(["error", "success"])

export const flashMessageSchema = z.object({
  title: z.string(),
  type: flashType,
  description: z.string().optional(),
})

export const createFlashSchema = flashMessageSchema.extend({ type: flashType.optional() })

export const flashSchema = z.object({ message: flashMessageSchema.optional() })

const flashStorage = createTypedSessionStorage({ sessionStorage: storage, schema: flashSchema })

export async function getFlashSession(request: Request) {
  const session = await flashStorage.getSession(request.headers.get("Cookie"))
  const commit = () => flashStorage.commitSession(session)

  const flash = session.get("message")

  const createFlash = (flash: z.infer<typeof createFlashSchema>) => {
    session.flash("message", { ...flash, type: flash.type || "success" })
    return commit()
  }
  return { message: flash, createFlash, commit, session }
}
