import * as c from "@chakra-ui/react"
import type { ActionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Link, useParams } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/Form"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { resetPassword } from "~/services/auth/auth.server"

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData()
  const resetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(8, "Must be at least 8 characters"),
  })
  const { data, fieldErrors } = await validateFormData(resetPasswordSchema, formData)
  if (fieldErrors) return badRequest({ fieldErrors, data })
  await resetPassword(data)
  return redirect("/login")
}

export default function ResetPassword() {
  const { token } = useParams()

  return (
    <Form method="post">
      <c.Stack spacing={4}>
        <c.Box>
          <c.Heading as="h1">Reset password</c.Heading>
          <c.Text>Enter a new password below.</c.Text>
        </c.Box>
        <input name="token" type="hidden" value={token} />
        <FormField isRequired label="Password" name="password" type="password" placeholder="********" />
        <FormError />
        <FormButton w="100%" colorScheme="primary">
          Reset
        </FormButton>
        <Link to="/login">Login</Link>
      </c.Stack>
    </Form>
  )
}
