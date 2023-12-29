import { sendResetPasswordEmail } from "@element/server-services"
import { type ActionFunctionArgs } from "@remix-run/node"
import { Link } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/ui/Form"
import { db } from "~/lib/db.server"
import { formError, validateFormData } from "~/lib/form.server"
import { createToken } from "~/lib/jwt.server"
import { redirect } from "~/lib/remix"

export const headers = () => {
  return {
    "Cache-Control": "max-age=3600, s-maxage=86400",
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const schema = z.object({ email: z.string().email("Invalid email") })
  const result = await validateFormData(request, schema)
  if (!result.success) return formError(result)
  const user = await db.user.findUnique({ where: { email: result.data.email } })
  if (user) {
    const token = await createToken({ id: user.id })
    await sendResetPasswordEmail(user, token)
  }
  return redirect("/login", request, { flash: { title: "Reset link sent to your email" } })
}

export default function ForgotPassword() {
  return (
    <Form>
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
