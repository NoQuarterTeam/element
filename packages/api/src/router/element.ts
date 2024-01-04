import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { Prisma, type Element } from "@element/database/types"
import { elementSchema, updateElementSchema } from "@element/server-schemas"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const elementRouter = createTRPCRouter({
  all: protectedProcedure.query(({ ctx }) => {
    // order by latest tasks elements
    return ctx.prisma.$queryRaw<Array<Pick<Element, "id" | "name" | "color"> & { latestTaskDate: string }>>`
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
          creatorId = ${ctx.user.id} AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        GROUP BY
          elementId
      ) AS task ON Element.id = task.elementId
      WHERE
        Element.creatorId = ${ctx.user.id} AND Element.archivedAt IS NULL
      ORDER BY
	      task.latestTaskDate DESC,
	      Element.createdAt DESC;
    `
  }),
  grouped: protectedProcedure.query(({ ctx }) => {
    const elementSelectFields = {
      id: true,
      name: true,
      archivedAt: true,
      color: true,
    } satisfies Prisma.ElementSelect
    return ctx.prisma.element.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        ...elementSelectFields,
        children: {
          where: { archivedAt: null },
          select: {
            ...elementSelectFields,
            children: {
              where: { archivedAt: null },
              select: { ...elementSelectFields, children: { where: { archivedAt: null }, select: elementSelectFields } },
            },
          },
        },
      },
      where: { archivedAt: null, parentId: { equals: null }, creatorId: { equals: ctx.user.id } },
    })
  }),
  byId: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.prisma.element.findUnique({ where: { id: input.id, creatorId: { equals: ctx.user.id } } })
  }),
  create: protectedProcedure.input(elementSchema).mutation(({ ctx, input }) => {
    return ctx.prisma.element.create({ data: { ...input, creatorId: ctx.user.id } })
  }),
  update: protectedProcedure
    .input(updateElementSchema.merge(z.object({ id: z.string() })))
    .mutation(({ ctx, input: { id, ...input } }) => {
      const element = ctx.prisma.element.findUnique({ where: { id, creatorId: { equals: ctx.user.id } } })
      if (!element) throw new TRPCError({ code: "NOT_FOUND", message: "Element not found" })
      return ctx.prisma.element.update({ where: { id }, data: { ...input, creatorId: ctx.user.id } })
    }),
})
