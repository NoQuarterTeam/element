import type { Prisma, User } from "@prisma/client"
import { redirect } from "@remix-run/node"

import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import type { Await } from "~/lib/helpers/types"
import { createToken, decryptToken } from "~/lib/jwt.server"
import { stripe } from "~/lib/stripe/stripe.server"

import { getFlashSession, getUserSession } from "../session/session.server"
import { sendPasswordChangedEmail, sendResetPasswordEmail } from "../user/user.mailer.server"
import { comparePasswords, hashPassword } from "./password.server"

export type LoginResponse = { success: false; error: string } | { success: true; user: User }
export async function login({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<LoginResponse> {
  const user = await db.user.findUnique({ where: { email } })
  if (!user) return { success: false, error: "Incorrect email or password" }
  if (user?.archivedAt) return { success: false, error: "Incorrect email or password" }
  const isCorrectPassword = await comparePasswords(password, user.password)
  if (!isCorrectPassword) return { success: false, error: "Incorrect email or password" }
  return { success: true, user }
}

export async function sendResetPasswordLink({ email }: { email: string }) {
  const user = await db.user.findUnique({ where: { email } })
  if (user) {
    const token = createToken({ id: user.id })
    await sendResetPasswordEmail(user, token)
  }
  return true
}

export async function resetPassword({ token, password }: { token: string; password: string }) {
  try {
    const payload = decryptToken<{ id: string }>(token)
    const hashedPassword = await hashPassword(password)
    const user = await db.user.update({
      where: { id: payload.id },
      data: { password: hashedPassword },
    })
    await sendPasswordChangedEmail(user)
    return true
  } catch (error) {
    return false
  }
}

export async function register(data: Prisma.UserCreateInput) {
  const email = data.email.toLowerCase().trim()
  const existing = await db.user.findFirst({ where: { email } })
  if (existing) return { error: "User with these details already exists" }
  const password = await hashPassword(data.password)
  const stripeCustomer = await stripe.customers.create({
    email,
    name: data.firstName + " " + data.lastName,
  })
  const user = await db.user.create({ data: { ...data, password, stripeCustomerId: stripeCustomer.id } })
  return { user }
}

const userSelectFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  stripeSubscriptionId: true,
  stripeCustomerId: true,
  subscriptionStatus: true,
}
export async function getUser(request: Request) {
  const { userId } = await getUserSession(request)
  if (!userId) return null
  return db.user.findFirst({
    where: { id: userId, archivedAt: { equals: null } },
    select: userSelectFields,
  })
}
export type MaybeUser = Await<typeof getUser>

export async function requireUser(request: Request) {
  const { userId } = await getUserSession(request)
  if (!userId) throw redirect(`/login`)

  const user = await db.user.findFirst({
    where: { id: userId, archivedAt: { equals: null } },
    select: userSelectFields,
  })
  if (!user) throw redirect(`/login`)
  return user
}
export type CurrentUser = Await<typeof requireUser>

export async function logout(request: Request) {
  const { destroy } = await getUserSession(request)
  const { createFlash } = await getFlashSession(request)
  const headers = new Headers([
    ["Set-Cookie", await destroy()],
    ["Set-Cookie", await createFlash(FlashType.Success, "Successfully logged out!")],
  ])
  return redirect("/", { headers })
}
