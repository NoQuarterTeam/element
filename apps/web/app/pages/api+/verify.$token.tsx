import { type LoaderFunctionArgs, redirect } from "@remix-run/node"

import { db } from "~/lib/db.server"
import { decryptToken } from "~/lib/jwt.server"

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const token = params.token
  if (!token) return redirect("/")
  const { id } = await decryptToken<{ id: string }>(token)
  const user = await db.user.findUnique({ where: { id } })
  if (!user) return redirect("/")
  await db.user.update({ where: { id }, data: { verifiedAt: new Date() } })
  return redirect("/timeline/verified")
}
