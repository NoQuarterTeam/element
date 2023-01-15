import type { ActionArgs, MetaFunction } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Link } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/ui/Form"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"

import { comparePasswords } from "~/services/auth/password.server"
import { getUserSession } from "~/services/session/session.server"

export const meta: MetaFunction = () => {
  return { title: "Login" }
}
export const headers = () => {
  return {
    "Cache-Control": "max-age=3600, s-maxage=86400",
  }
}

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData()
  const loginSchema = z.object({
    email: z.string().min(3).email("Invalid email"),
    password: z.string().min(8, "Must be at least 8 characters"),
  })
  const { data, fieldErrors } = await validateFormData(loginSchema, formData)
  if (fieldErrors) return badRequest({ fieldErrors, data })
  const user = await db.user.findUnique({ where: { email: data.email } })
  if (!user) return badRequest({ formError: "Incorrect email or password" })
  if (user.archivedAt) return badRequest({ formError: "Incorrect email or password" })
  const isCorrectPassword = await comparePasswords(data.password, user.password)
  if (!isCorrectPassword) return badRequest({ formError: "Incorrect email or password" })

  const { setUser } = await getUserSession(request)
  const headers = new Headers([["Set-Cookie", await setUser(user.id)]])
  return redirect("/timeline", { headers })
}

export default function Login() {
  return (
    <Form method="post" replace>
      <div className="stack">
        <h1 className="text-6xl">Login</h1>
        <FormField required label="Email address" name="email" placeholder="jim@gmail.com" />
        <FormField required label="Password" name="password" type="password" placeholder="********" />
        <div>
          <FormButton className="w-full">Login</FormButton>
          <FormError />
        </div>

        <div className="flex justify-between">
          <Link to="/register">Register</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </div>
    </Form>
  )
}
