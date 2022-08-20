import type { LoaderArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import dayjs from "dayjs"

import { taskSelectFields } from "~/components/TaskItem"
import { db } from "~/lib/db.server"
import { DAYS_BACK, DAYS_FORWARD } from "~/lib/hooks/useTimelineDays"
import { badRequest } from "~/lib/remix"

export const loader = async ({ request, params }: LoaderArgs) => {
  const id = params.id as string | undefined
  if (!id) throw badRequest("Id required")
  const url = new URL(request.url)
  const backParam = url.searchParams.get("back")
  const forwardParam = url.searchParams.get("forward")
  const back = backParam ? parseInt(backParam) : DAYS_BACK
  const forward = forwardParam ? parseInt(forwardParam) : DAYS_FORWARD

  const tasks = await db.task.findMany({
    select: taskSelectFields,
    where: {
      date: {
        gte: dayjs().subtract(back, "day").toDate(),
        lte: dayjs().add(forward, "day").toDate(),
      },
      element: { teamId: { equals: id } },
    },
  })
  return json(tasks)
}
