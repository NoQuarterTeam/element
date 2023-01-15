import { Prisma } from "@prisma/client"
import { redirect } from "@remix-run/node"

import { db } from "~/lib/db.server"
import type { Await } from "~/lib/helpers/types"

import { getUserSession } from "../session/session.server"

export async function requireUser(request: Request) {
  const { userId } = await getUserSession(request)
  if (!userId) throw redirect(`/login`)
  return userId
}

const userSelectFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  role: true,
  stripeSubscriptionId: true,
  stripeCustomerId: true,
} satisfies Prisma.UserSelect

export async function getUser(request: Request) {
  const userId = await requireUser(request)
  const user = await db.user.findFirst({
    where: { id: userId, archivedAt: { equals: null } },
    select: userSelectFields,
  })
  if (!user) throw redirect(`/login`)
  return user
}
export type CurrentUser = Await<typeof requireUser>
