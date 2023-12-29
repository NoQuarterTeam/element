import { loginSchema } from "@element/server-schemas"
import { comparePasswords } from "@element/server-services"
import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Link, useSearchParams } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/ui/Form"
import { db } from "~/lib/db.server"
import { formError, validateFormData } from "~/lib/form.server"
import { badRequest } from "~/lib/remix"
import { getUserSession } from "~/services/session/session.server"

export const meta: MetaFunction = () => {
  return [{ title: "Login" }]
}
export const headers = () => {
  return {
    "Cache-Control": "max-age=3600, s-maxage=86400",
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const schema = z.object({ redirectTo: z.string().nullable().optional() })
  const result = await validateFormData(request, loginSchema.merge(schema))
  if (!result.success) return formError(result)
  const data = result.data
  const redirectTo = data.redirectTo
  const user = await db.user.findUnique({ where: { email: data.email } })
  if (!user) return badRequest({ formError: "Incorrect email or password" })
  if (user.archivedAt) return badRequest({ formError: "Incorrect email or password" })
  const isCorrectPassword = await comparePasswords(data.password, user.password)
  if (!isCorrectPassword) return badRequest({ formError: "Incorrect email or password" })

  const { setUser } = await getUserSession(request)
  const headers = new Headers([["Set-Cookie", await setUser(user.id)]])
  return redirect(redirectTo || "/timeline", { headers })
}

export default function Login() {
  const [params] = useSearchParams()
  return (
    <Form method="post" replace>
      <div className="stack">
        <h1 className="text-4xl">Login</h1>
        <input type="hidden" name="redirectTo" value={params.get("redirectTo") || ""} />
        <FormField required label="Email address" name="email" placeholder="jim@gmail.com" />
        <FormField required label="Password" name="password" type="password" placeholder="********" />
        <div>
          <FormButton className="w-full">Login</FormButton>
          <FormError />
        </div>

        <div className="flex justify-between">
          <Link to="/register" className="hover:opacity-70">
            Register
          </Link>
          <Link to="/forgot-password" className="hover:opacity-70">
            Forgot password?
          </Link>
        </div>
      </div>
    </Form>
  )
}
