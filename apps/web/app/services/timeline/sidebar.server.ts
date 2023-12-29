import { type Prisma } from "@element/database/types"

import { db } from "~/lib/db.server"

const elementSelectFields = {
  id: true,
  name: true,
  archivedAt: true,
  color: true,
} satisfies Prisma.ElementSelect

export function getSidebarElements(userId: string) {
  return db.element.findMany({
    orderBy: { name: "asc" },
    select: {
      ...elementSelectFields,
      children: {
        select: {
          ...elementSelectFields,
          children: {
            select: {
              ...elementSelectFields,
              children: { select: elementSelectFields },
            },
          },
        },
      },
    },
    where: {
      parentId: { equals: null },
      creatorId: { equals: userId },
    },
  })
}
