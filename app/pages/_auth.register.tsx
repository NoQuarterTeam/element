import * as c from "@chakra-ui/react"
import type { ActionArgs, MetaFunction } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Link } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/Form"
import { FlashType } from "~/lib/config.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { register } from "~/services/auth/auth.server"
import { getFlashSession, getUserSession } from "~/services/session/session.server"

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

  const { user, error } = await register(data)
  if (error || !user) return badRequest({ data, formError: error })
  const { setUser } = await getUserSession(request)
  const { createFlash } = await getFlashSession(request)
  const headers = new Headers([
    ["Set-Cookie", await setUser(user.id)],
    ["Set-Cookie", await createFlash(FlashType.Success, "You are now logged in")],
  ])
  return redirect("/", { headers })
}

export default function Register() {
  return (
    <Form method="post" replace>
      <c.Stack spacing={3}>
        <c.Heading as="h1" fontSize="6xl">
          Register
        </c.Heading>
        <FormField isRequired label="Email address" name="email" placeholder="jim@gmail.com" />
        <FormField isRequired label="Password" name="password" type="password" placeholder="********" />
        <FormField isRequired label="First name" name="firstName" placeholder="Jim" />
        <FormField isRequired label="Last name" name="lastName" placeholder="Bob" />
        <c.Box>
          <FormButton w="100%">Register</FormButton>
          <FormError />
        </c.Box>

        <c.Flex justify="space-between">
          <Link to="/login">Login</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </c.Flex>
      </c.Stack>
    </Form>
  )
}
