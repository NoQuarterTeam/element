import * as c from "@chakra-ui/react"
import { Outlet } from "@remix-run/react"
import type { LoaderArgs} from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime"

import { getUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  if (user) return redirect("/")
  return null
}

export default function AuthLayout() {
  return (
    <c.Center flexDir="column" pt={20}>
      <c.Box w={["100%", 400]} p={4}>
        <Outlet />
      </c.Box>
    </c.Center>
  )
}
