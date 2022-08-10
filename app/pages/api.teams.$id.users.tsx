import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"

import { db } from "~/lib/db.server"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"

export const loader = async ({ request, params }: LoaderArgs) => {
  await requireUser(request)
  const id = params.id as string | undefined
  if (!id) throw badRequest("Missing missing team id")
  const users = await db.team
    .findUnique({ where: { id } })
    .users({ select: { id: true, firstName: true, lastName: true, avatar: true } })
  return json({ users })
}

export type TeamUser = UseDataFunctionReturn<typeof loader>["users"][0]
