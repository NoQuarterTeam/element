import { json as remixJson, redirect as remixRedirect } from "@remix-run/node"
import type { z } from "zod"

import { type createFlashSchema, getFlashSession } from "~/services/session/flash.server"

export async function badRequest(
  data: unknown,
  request?: Request,
  init?: ResponseInit & { flash?: z.infer<typeof createFlashSchema> },
) {
  if (!request || !init) return remixJson(data, { status: 400, ...init })
  const headers = new Headers(init.headers)
  const flash = init.flash
  if (flash) {
    const { createFlash } = await getFlashSession(request)
    headers.append("set-cookie", await createFlash({ ...flash, type: "error" }))
  }

  return remixJson(data, { status: 400, ...init, headers })
}

export async function json<T>(data: T, request?: Request, init?: ResponseInit & { flash?: z.infer<typeof createFlashSchema> }) {
  if (!request || !init) return remixJson(data, { status: 200, ...init })
  const headers = new Headers(init.headers)
  const flash = init.flash
  if (flash) {
    const { createFlash } = await getFlashSession(request)
    headers.append("set-cookie", await createFlash(flash))
  }
  return remixJson(data, { status: 200, ...init, headers })
}

export const notFound = (data?: BodyInit) => new Response(data || null, { status: 404, statusText: "Not Found" })

export async function redirect(
  url: string,
  request?: Request,
  init?: ResponseInit & { flash?: z.infer<typeof createFlashSchema> },
) {
  if (!request || !init) return remixRedirect(url)
  const headers = new Headers(init.headers)
  const flash = init.flash
  if (flash) {
    const { createFlash } = await getFlashSession(request)
    headers.append("set-cookie", await createFlash(flash))
  }

  return remixRedirect(url, { ...init, headers })
}
