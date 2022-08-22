import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"

import { db } from "~/lib/db.server"
import { requireUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const elements = await db.element.findMany({
    orderBy: { name: "asc" },
    where: { archivedAt: { equals: null }, creatorId: { equals: user.id } },
  })

  return json({ elements })
}

export type TaskElement = UseDataFunctionReturn<typeof loader>["elements"][0]
