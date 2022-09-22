import type { LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"

import { db } from "~/lib/db.server"
import { requireUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const url = new URL(request.url)
  const query = url.searchParams.get("q")
  if (!query) return json({ tasks: [], count: 0 })
  const tasks = await db.task.findMany({
    take: 20,
    orderBy: { date: "desc" },
    select: { id: true, name: true, date: true, element: { select: { id: true, color: true, name: true } } },
    where: { creatorId: { equals: user.id }, name: { contains: query, mode: "insensitive" } },
  })
  const count = await db.task.count({
    where: { creatorId: { equals: user.id }, name: { contains: query, mode: "insensitive" } },
  })
  return json({ tasks, count })
}

export type TasksSearch = SerializeFrom<typeof loader>
