import type { LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"

import { db } from "~/lib/db.server"
import { requireUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const elements = await db.element.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
    where: { archivedAt: { equals: null }, creatorId: { equals: user.id } },
  })

  return json(elements)
}

export type TaskElement = SerializeFrom<typeof loader>[0]
