import * as c from "@chakra-ui/react"
import { Link } from "@remix-run/react"
import type { LoaderArgs, MetaFunction} from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"

import { getUser } from "~/services/auth/auth.server"

export const meta: MetaFunction = () => {
  return { title: "Element" }
}

export const headers = () => {
  return {
    "Cache-Control": "max-age=3600, s-maxage=86400",
  }
}

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  if (user) return redirect("/timeline")
  return json(null)
}

export default function HomeLayout() {
  return (
    <c.LightMode>
      <c.Center pt={8}>
        <c.VStack>
          <c.Image src="/logo.png" boxSize="100px" />
          <Link to="/login">Login</Link>
        </c.VStack>
      </c.Center>
    </c.LightMode>
  )
}
