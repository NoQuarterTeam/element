import { db } from "~/lib/db.server"

const elementSelectFields = {
  id: true,
  name: true,
  archivedAt: true,
  color: true,
}
export async function getSidebarElements(userId: string) {
  return await db.element.findMany({
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
