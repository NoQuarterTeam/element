import { db } from "~/lib/db.server"

const elementSelectFields = {
  id: true,
  name: true,
  color: true,
  teamId: true,
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
      teamId: { equals: null },
      creatorId: { equals: userId },
    },
  })
}

export async function getSidebarTeams(userId: string) {
  return await db.user.findUniqueOrThrow({ where: { id: userId } }).teams({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      logo: true,
      elements: {
        where: { archivedAt: { equals: null }, parentId: { equals: null } },
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
      },
    },
  })
}
