import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node"

import { Link } from "@remix-run/react"
import { z } from "zod"

import { Form, FormButton, FormError, FormField } from "~/components/ui/Form"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest, redirect } from "~/lib/remix"
import { stripe } from "~/lib/stripe/stripe.server"
import { hashPassword } from "~/services/auth/password.server"
import { generateFakeUser } from "~/services/auth/temporary-account.server"
import { FlashType, getFlashSession } from "~/services/session/flash.server"
import { getUserSession } from "~/services/session/session.server"
import { createTemplates } from "~/services/timeline/templates.server"
import { sendEmailVerification } from "~/services/user/user.mailer.server"

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
  RegisterTemporay = "RegisterTemporay",
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const action = formData.get("_action") as RegisterActionMethods | undefined

  switch (action) {
    case RegisterActionMethods.Register:
      try {
        if (formData.get("passwordConfirmation")) return redirect("/")
        const registerSchema = z.object({
          email: z.string().min(3).email("Invalid email"),
          password: z.string().min(8, "Must be at least 8 characters"),
          firstName: z.string().min(2, "Must be at least 2 characters"),
          lastName: z.string().min(2, "Must be at least 2 characters"),
        })
        const { data, fieldErrors } = await validateFormData(registerSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })

        const email = data.email.toLowerCase().trim()
        const existing = await db.user.findFirst({ where: { email } })
        if (existing) return badRequest({ data, formError: "User with these details already exists" })
        const password = await hashPassword(data.password)
        const stripeCustomer = await stripe.customers.create({
          email,
          name: data.firstName + " " + data.lastName,
        })
        const user = await db.user.create({ data: { ...data, email, password, stripeCustomerId: stripeCustomer.id } })
        await createTemplates(user.id)
        const { setUser } = await getUserSession(request)
        await sendEmailVerification(user)

        const headers = new Headers([["Set-Cookie", await setUser(user.id)]])
        return redirect("/timeline", request, {
          flash: {
            title: "Welcome to Element, " + data.firstName,
            description: "Check your emails to verify your account.",
          },
          headers,
        })
      } catch (e: any) {
        return badRequest(e.message)
      }
    case RegisterActionMethods.RegisterTemporay:
      try {
        if (formData.get("passwordConfirmation")) return redirect("/")
        const data = await generateFakeUser()
        const stripeCustomer = await stripe.customers.create({
          email: data.email,
          name: data.firstName + " " + data.lastName,
        })
        const user = await db.user.create({ data: { ...data, stripeCustomerId: stripeCustomer.id } })
        await createTemplates(user.id)
        const { setUser } = await getUserSession(request)
        const headers = new Headers([["Set-Cookie", await setUser(user.id)]])
        return redirect("/timeline", request, {
          flash: {
            title: "Welcome to Element, " + data.firstName,
            description: "This is a temporary account, change your email to convert to a permanent account.",
          },
          headers,
        })
      } catch (e: any) {
        return badRequest(e.message)
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
      <div>
        <div className="flex items-center justify-center py-4">
          <div className="mr-3 flex-grow border-t border-gray-300 dark:border-gray-700" aria-hidden="true"></div>
          <div className="opacity-50">or</div>
          <div className="ml-3 flex-grow border-t border-gray-300 dark:border-gray-700" aria-hidden="true"></div>
        </div>
        <Form method="post" replace>
          <input name="passwordConfirmation" className="hidden" />
          <FormButton
            variant="outline"
            colorScheme="gray"
            type="submit"
            name="_action"
            value={RegisterActionMethods.RegisterTemporay}
            className="w-full"
          >
            Create a temporary account
          </FormButton>
        </Form>
        <p className="pt-1 text-center text-xs opacity-60">This can be converted to a real account later on</p>
      </div>
    </div>
  )
}
