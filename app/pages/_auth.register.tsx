import type { ActionArgs, MetaFunction } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Link } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/ui/Form"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { stripe } from "~/lib/stripe/stripe.server"
import { hashPassword } from "~/services/auth/password.server"
import { FlashType, getFlashSession } from "~/services/session/flash.server"
import { getUserSession } from "~/services/session/session.server"
import { createTemplates } from "~/services/timeline/templates.server"
import { sendEmailVerification } from "~/services/user/user.mailer.server"

export const meta: MetaFunction = () => {
  return { title: "Register" }
}

export const headers = () => {
  return {
    "Cache-Control": "max-age=3600, s-maxage=86400",
  }
}

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData()
  const registerSchema = z.object({
    email: z.string().min(3).email("Invalid email"),
    password: z.string().min(8, "Must be at least 8 characters"),
    firstName: z.string().min(2, "Must be at least 2 characters"),
    lastName: z.string().min(2, "Must be at least 2 characters"),
  })
  const { data, fieldErrors } = await validateFormData(registerSchema, formData)
  if (fieldErrors) return badRequest({ fieldErrors, data })

  const email = data.email.toLowerCase().trim()
  const existing = await db.user.findFirst({ where: { email } })
  if (existing) return badRequest({ data, formError: "User with these details already exists" })
  const password = await hashPassword(data.password)
  const stripeCustomer = await stripe.customers.create({
    email,
    name: data.firstName + " " + data.lastName,
  })
  const user = await db.user.create({ data: { ...data, email, password, stripeCustomerId: stripeCustomer.id } })
  await createTemplates(user.id)
  const { setUser } = await getUserSession(request)
  await sendEmailVerification(user)
  const { createFlash } = await getFlashSession(request)
  const headers = new Headers([
    ["Set-Cookie", await setUser(user.id)],
    ["Set-Cookie", await createFlash(FlashType.Info, "Welcome to Element!", "Check your emails to verify your account.")],
  ])
  return redirect("/timeline", { headers })
}

export default function Register() {
  return (
    <Form method="post" replace>
      <div className="stack">
        <h1 className="text-6xl font-bold">Register</h1>
        <FormField required label="Email address" name="email" placeholder="jim@gmail.com" />
        <FormField required label="Password" name="password" type="password" placeholder="********" />
        <FormField required label="First name" name="firstName" placeholder="Jim" />
        <FormField required label="Last name" name="lastName" placeholder="Bob" />
        <div>
          <FormButton className="w-full">Register</FormButton>
          <FormError />
        </div>

        <div className="flex justify-between">
          <Link to="/login" className="hover:opacity-70">
            Login
          </Link>
          <Link to="/forgot-password" className="hover:opacity-70">
            Forgot password?
          </Link>
        </div>
      </div>
    </Form>
  )
}
