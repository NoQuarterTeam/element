import * as React from "react"
import * as c from "@chakra-ui/react"
import type { ActionArgs } from "@remix-run/node"
import { Link, useTransition } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/Form"
import { validateFormData } from "~/lib/form"
import { useToast } from "~/lib/hooks/useToast"
import { badRequest } from "~/lib/remix"
import { sendResetPasswordLink } from "~/services/auth/auth.server"

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData()
  const resetSchema = z.object({ email: z.string().email("Invalid email") })
  const { data, fieldErrors } = await validateFormData(resetSchema, formData)
  if (fieldErrors) return badRequest({ fieldErrors, data })
  await sendResetPasswordLink(data)
  return true
}

export default function ForgotPassword() {
  const { type } = useTransition()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const toast = useToast()
  React.useEffect(() => {
    if (type === "actionSubmission") {
      toast({ description: "Reset link sent to your email", status: "success" })
      if (!inputRef.current) return
      inputRef.current.value = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  return (
    <Form method="post">
      <c.Stack spacing={4}>
        <c.Heading as="h1">Forgot your password?</c.Heading>
        <c.Text>Enter your email below to receive your password reset instructions.</c.Text>
        <FormField isRequired label="Email address" name="email" placeholder="jim@gmail.com" />
        <FormError />
        <FormButton w="100%" colorScheme="primary">
          Send instructions
        </FormButton>
        <Link to="/login">Login</Link>
      </c.Stack>
    </Form>
  )
}
