import * as c from "@chakra-ui/react"
import { Outlet } from "@remix-run/react"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { redirect } from "@remix-run/server-runtime"

import { getUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  if (user) return redirect("/")
  return null
}

export default function AuthLayout() {
  return (
    <c.Center flexDir="column" pt={{ base: 10, md: 20 }}>
      <c.VStack spacing={4} p={4}>
        <c.Image src="/logo.png" w="100px" h="100px" />
        <c.Box w={["100%", 400]}>
          <Outlet />
        </c.Box>
      </c.VStack>
    </c.Center>
  )
}
