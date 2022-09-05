import * as c from "@chakra-ui/react"
import type { LoaderArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Outlet } from "@remix-run/react"

import { getUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  if (user) return redirect("/")
  return null
}

export default function AuthLayout() {
  const { colorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  return (
    <c.Center flexDir="column" pt={{ base: 10, md: 20 }}>
      <c.VStack spacing={4} p={4} w="100%">
        <c.Image src={isDark ? "/logo-dark.png" : "/logo.png"} boxSize="100px" />
        <c.Box w={{ base: "100%", sm: 400 }}>
          <Outlet />
        </c.Box>
      </c.VStack>
    </c.Center>
  )
}
