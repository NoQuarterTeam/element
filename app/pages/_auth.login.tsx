import * as c from "@chakra-ui/react"
import type { ActionArgs, MetaFunction } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Link } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/Form"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { login } from "~/services/auth/auth.server"
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
  const result = await login(data)
  if (!result.success) return badRequest({ data, formError: result.error })
  const { setUser } = await getUserSession(request)
  const headers = new Headers([["Set-Cookie", await setUser(result.user.id)]])
  return redirect("/timeline", { headers })
}

export default function Login() {
  return (
    <Form method="post" replace>
      <c.Stack spacing={3}>
        <c.Heading as="h1" fontSize="6xl">
          Login
        </c.Heading>
        <FormField isRequired label="Email address" name="email" placeholder="jim@gmail.com" />
        <FormField isRequired label="Password" name="password" type="password" placeholder="********" />
        <c.Box>
          <FormButton type="submit" w="100%">
            Login
          </FormButton>
          <FormError />
        </c.Box>

        <c.Flex justify="space-between">
          <Link to="/register">Register</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </c.Flex>
      </c.Stack>
    </Form>
  )
}
