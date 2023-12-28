import { createSignedUrl } from "@element/server-services"
import { type ActionFunctionArgs, json } from "@remix-run/node"
import { z } from "zod"

import { formError, validateFormData } from "~/lib/form.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const creatSignedUrlSchema = z.object({ key: z.string().min(1) })
  const result = await validateFormData(request, creatSignedUrlSchema)
  if (!result.success) return formError(result)
  const signedUrl = await createSignedUrl(result.data.key)
  return json(signedUrl)
}
