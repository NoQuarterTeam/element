import { db } from "~/lib/db.server"

const elementSelectFields = {
  id: true,
  name: true,
  color: true,
}
export async function getSidebarElements(userId: string) {
  return await db.element.findMany({
    orderBy: { name: "asc" },
    select: {
      ...elementSelectFields,
      children: {
        where: { archivedAt: { equals: null } },
        select: {
          ...elementSelectFields,
          children: {
            where: { archivedAt: { equals: null } },
            select: {
              ...elementSelectFields,
              children: { select: elementSelectFields, where: { archivedAt: { equals: null } } },
            },
          },
        },
      },
    },
    where: {
      archivedAt: { equals: null },
      parentId: { equals: null },
      creatorId: { equals: userId },
    },
  })
}
