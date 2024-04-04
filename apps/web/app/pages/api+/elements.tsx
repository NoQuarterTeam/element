import type { Element } from "@element/database/types"
import type { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"

import { db } from "~/lib/db.server"
import { getCurrentUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)

  const elements = await db.$queryRaw<Array<Pick<Element, "id" | "name" | "color"> & { latestTaskDate: string }>>`
      SELECT
        Element.id,
        Element.name,
        Element.color,
        task.latestTaskDate
      FROM
        Element
      LEFT JOIN (
        SELECT
          elementId,
          MAX(createdAt) AS latestTaskDate
        FROM
          Task
        WHERE
          creatorId = ${user.id} AND createdAt >= NOW() - INTERVAL '1 MONTH'
        GROUP BY
          elementId
      ) AS task ON Element.id = task.elementId
      WHERE
        Element.creatorId = ${user.id} AND Element.archivedAt IS NULL
      ORDER BY
	      task.latestTaskDate DESC,
	      Element.createdAt DESC;
    `
  return json(elements)
}

export type TaskElement = SerializeFrom<typeof loader>[0]
