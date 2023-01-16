import * as React from "react"
import type { ActionArgs } from "@remix-run/node"
import { Link, useTransition } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/ui/Form"
import { validateFormData } from "~/lib/form"

import { badRequest } from "~/lib/remix"

import { db } from "~/lib/db.server"
import { createToken } from "~/lib/jwt.server"
import { sendResetPasswordEmail } from "~/services/user/user.mailer.server"
import { useToast } from "~/components/ui/Toast"

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData()
  const resetSchema = z.object({ email: z.string().email("Invalid email") })
  const { data, fieldErrors } = await validateFormData(resetSchema, formData)
  if (fieldErrors) return badRequest({ fieldErrors, data })
  const user = await db.user.findUnique({ where: { email: data.email } })
  if (user) {
    const token = createToken({ id: user.id })
    await sendResetPasswordEmail(user, token)
  }
  return true
}

export default function ForgotPassword() {
  const { type } = useTransition()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const toast = useToast()
  React.useEffect(() => {
    if (type === "actionSubmission") {
      toast({ description: "Reset link sent to your email" })
      if (!inputRef.current) return
      inputRef.current.value = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  return (
    <Form method="post">
      <div className="stack">
        <h1 className="text-6xl font-bold">Forgot your password?</h1>
        <p>Enter your email below to receive your password reset instructions.</p>
        <FormField required label="Email address" name="email" placeholder="jim@gmail.com" />
        <FormError />
        <FormButton className="w-full">Send instructions</FormButton>
        <Link to="/login">Login</Link>
      </div>
    </Form>
  )
}
