import { type ActionFunctionArgs } from "@remix-run/node"
import { Link } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/ui/Form"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { createToken } from "~/lib/jwt.server"
import { badRequest, redirect } from "~/lib/remix"
import { sendResetPasswordEmail } from "~/services/user/user.mailer.server"

export const headers = () => {
  return {
    "Cache-Control": "max-age=3600, s-maxage=86400",
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const resetSchema = z.object({ email: z.string().email("Invalid email") })
  const { data, fieldErrors } = await validateFormData(resetSchema, formData)
  if (fieldErrors) return badRequest({ fieldErrors, data })
  const user = await db.user.findUnique({ where: { email: data.email } })
  if (user) {
    const token = await createToken({ id: user.id })
    await sendResetPasswordEmail(user, token)
  }

  return redirect("/login", request, {
    flash: { title: "Reset link sent to your email" },
  })
}

export default function ForgotPassword() {
  return (
    <Form method="post">
      <div className="stack">
        <h1 className="text-4xl font-bold">Forgot password?</h1>
        <p>Enter your email below to receive your password reset instructions.</p>
        <FormField required label="Email address" name="email" placeholder="jim@gmail.com" />
        <FormError />
        <FormButton className="w-full">Send instructions</FormButton>
        <Link to="/login">Login</Link>
      </div>
    </Form>
  )
}
