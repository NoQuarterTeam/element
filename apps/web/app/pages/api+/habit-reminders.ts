import { ActionFunctionArgs } from "@remix-run/node"
import { json } from "~/lib/remix"

export const action = ({ request }: ActionFunctionArgs) => {
  return json({ success: true })
}
