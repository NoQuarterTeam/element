import { registerSchema } from "@element/server-schemas"
import { createTemplates, hashPassword, sendAccountVerificationEmail, stripe } from "@element/server-services"
import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link } from "@remix-run/react"

import { Form, FormButton, FormError, FormField } from "~/components/ui/Form"
import { db } from "~/lib/db.server"
import { FORM_ACTION } from "~/lib/form"
import { formError, validateFormData } from "~/lib/form.server"
import { createToken } from "~/lib/jwt.server"
import { badRequest, redirect } from "~/lib/remix"

import { getUserSession } from "~/services/session/session.server"

export const meta: MetaFunction = () => {
  return [{ title: "Register" }]
}
export const headers = () => {
  return {
    "Cache-Control": "max-age=3600, s-maxage=86400",
  }
}

enum RegisterActionMethods {
  Register = "Register",
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const action = formData.get(FORM_ACTION) as RegisterActionMethods | undefined

  switch (action) {
    case RegisterActionMethods.Register:
      try {
        if (formData.get("passwordConfirmation")) return redirect("/")

        const result = await validateFormData(request, registerSchema)
        if (!result.success) return formError(result)
        const data = result.data

        const email = data.email.toLowerCase().trim()
        const existing = await db.user.findFirst({ where: { email } })
        if (existing) return badRequest({ data, formError: "User with these details already exists" })
        const password = hashPassword(data.password)
        const stripeCustomer = await stripe.customers.create({
          email,
          name: data.firstName + " " + data.lastName,
        })
        const user = await db.user.create({ data: { ...data, email, password, stripeCustomerId: stripeCustomer.id } })
        const elements = createTemplates(user.id)
        for await (const element of elements) {
          await db.element.create({ data: element })
        }
        const { setUser } = await getUserSession(request)
        const token = await createToken({ id: user.id })
        await sendAccountVerificationEmail(user, token)

        const headers = new Headers([["Set-Cookie", await setUser(user.id)]])
        return redirect("/timeline", request, {
          flash: {
            title: "Welcome to Element, " + data.firstName,
            description: "Check your emails to verify your account.",
          },
          headers,
        })
      } catch (e: unknown) {
        if (e instanceof Error) {
          return badRequest(e.message)
        } else {
          return badRequest("Something went wrong")
        }
      }

    default:
      break
  }
}

export default function Register() {
  return (
    <div>
      <Form method="post" replace>
        <div className="stack">
          <h1 className="text-4xl font-bold">Register</h1>
          <FormField required label="Email address" name="email" placeholder="jim@gmail.com" />
          <FormField required label="Password" name="password" type="password" placeholder="********" />
          <input name="passwordConfirmation" className="hidden" />
          <FormField required label="First name" name="firstName" placeholder="Jim" />
          <FormField required label="Last name" name="lastName" placeholder="Bob" />
          <div>
            <FormButton name="_action" value={RegisterActionMethods.Register} className="w-full">
              Register
            </FormButton>
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
    </div>
  )
}
